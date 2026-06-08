const pool = require('../config/db')

const FINE_PER_DAY   = 2.00   // ₹2 per day overdue
const LOAN_DAYS      = 14     // default loan period

// ── GET /api/library/books ────────────────────────────────────────────
const getAllBooks = async (req, res) => {
  const { search, category, available } = req.query
  try {
    let filters = ''
    const params = []
    let   idx    = 1

    if (search) {
      filters += ` AND (
        LOWER(b.title)  LIKE LOWER($${idx})
        OR LOWER(b.author) LIKE LOWER($${idx})
        OR b.isbn = $${idx}
      )`
      params.push(`%${search}%`)
      idx++
    }

    if (category) {
      filters += ` AND b.category = $${idx++}`
      params.push(category)
    }

    if (available === 'true') {
      filters += ` AND b.available_copies > 0`
    }

    const result = await pool.query(`
      SELECT
        b.*,
        COUNT(bi.id) FILTER (WHERE bi.return_date IS NULL) AS currently_issued
      FROM books b
      LEFT JOIN book_issues bi ON bi.book_id = b.id
      WHERE 1=1 ${filters}
      GROUP BY b.id
      ORDER BY b.title
    `, params)

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch books.' })
  }
}

// ── POST /api/library/books ───────────────────────────────────────────
const addBook = async (req, res) => {
  const {
    title, author, isbn, publisher,
    category, total_copies, rack_no,
  } = req.body

  if (!title)
    return res.status(400).json({ error: 'Book title is required.' })

  const copies = parseInt(total_copies) || 1

  try {
    const result = await pool.query(`
      INSERT INTO books
        (title, author, isbn, publisher, category,
         total_copies, available_copies, rack_no)
      VALUES ($1,$2,$3,$4,$5,$6,$6,$7)
      RETURNING *
    `, [
      title,
      author      || null,
      isbn        || null,
      publisher   || null,
      category    || 'General',
      copies,
      rack_no     || null,
    ])

    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'ISBN already exists.' })
    res.status(500).json({ error: 'Failed to add book.' })
  }
}

// ── PUT /api/library/books/:id ────────────────────────────────────────
const updateBook = async (req, res) => {
  const {
    title, author, isbn, publisher,
    category, total_copies, rack_no,
  } = req.body

  try {
    // Recalculate available copies when total changes
    const existing = await pool.query(
      'SELECT * FROM books WHERE id = $1', [req.params.id]
    )
    if (!existing.rows[0])
      return res.status(404).json({ error: 'Book not found.' })

    const issued      = existing.rows[0].total_copies - existing.rows[0].available_copies
    const newTotal    = parseInt(total_copies) || existing.rows[0].total_copies
    const newAvailable = Math.max(0, newTotal - issued)

    const result = await pool.query(`
      UPDATE books
      SET title=$1, author=$2, isbn=$3, publisher=$4,
          category=$5, total_copies=$6, available_copies=$7, rack_no=$8
      WHERE id=$9
      RETURNING *
    `, [
      title, author || null, isbn || null, publisher || null,
      category || 'General', newTotal, newAvailable,
      rack_no || null, req.params.id,
    ])

    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'ISBN already exists.' })
    res.status(500).json({ error: 'Failed to update book.' })
  }
}

// ── DELETE /api/library/books/:id ─────────────────────────────────────
const deleteBook = async (req, res) => {
  try {
    const issued = await pool.query(
      'SELECT COUNT(*) FROM book_issues WHERE book_id=$1 AND return_date IS NULL',
      [req.params.id]
    )
    if (parseInt(issued.rows[0].count) > 0)
      return res.status(400).json({
        error: 'Cannot delete book with active issues. Return all copies first.',
      })

    await pool.query('DELETE FROM books WHERE id=$1', [req.params.id])
    res.json({ message: 'Book deleted.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book.' })
  }
}

// ── POST /api/library/issue ───────────────────────────────────────────
const issueBook = async (req, res) => {
  const { book_id, student_id, due_date } = req.body

  if (!book_id || !student_id)
    return res.status(400).json({ error: 'book_id and student_id are required.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Check availability
    const bookResult = await client.query(
      'SELECT * FROM books WHERE id=$1 FOR UPDATE', [book_id]
    )
    const book = bookResult.rows[0]

    if (!book)
      return res.status(404).json({ error: 'Book not found.' })

    if (book.available_copies < 1)
      return res.status(400).json({ error: 'No copies available for this book.' })

    // Check if student already has this book
    const existing = await client.query(`
      SELECT id FROM book_issues
      WHERE book_id=$1 AND student_id=$2 AND return_date IS NULL
    `, [book_id, student_id])

    if (existing.rows[0])
      return res.status(400).json({
        error: 'This student already has a copy of this book.',
      })

    // Calculate due date
    const dueDateObj = due_date
      ? new Date(due_date)
      : new Date(Date.now() + LOAN_DAYS * 86400000)
    const dueDateStr = dueDateObj.toISOString().split('T')[0]

    // Create issue record
    const issueResult = await client.query(`
      INSERT INTO book_issues
        (book_id, student_id, issue_date, due_date, fine_per_day, issued_by)
      VALUES ($1,$2,CURRENT_DATE,$3,$4,$5)
      RETURNING *
    `, [book_id, student_id, dueDateStr, FINE_PER_DAY, req.user.id])

    // Decrement available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id=$1',
      [book_id]
    )

    await client.query('COMMIT')

    res.status(201).json({
      message: `Book "${book.title}" issued successfully.`,
      issue:   issueResult.rows[0],
      due_date: dueDateStr,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Failed to issue book.' })
  } finally {
    client.release()
  }
}

// ── POST /api/library/return/:issueId ─────────────────────────────────
const returnBook = async (req, res) => {
  const { issueId } = req.params
  const { fine_paid } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const issueResult = await client.query(
      'SELECT * FROM book_issues WHERE id=$1 FOR UPDATE', [issueId]
    )
    const issue = issueResult.rows[0]

    if (!issue)
      return res.status(404).json({ error: 'Issue record not found.' })

    if (issue.return_date)
      return res.status(400).json({ error: 'Book already returned.' })

    // Calculate fine
    const today    = new Date()
    const dueDate  = new Date(issue.due_date)
    const overdue  = Math.max(0, Math.ceil((today - dueDate) / 86400000))
    const fine     = parseFloat((overdue * issue.fine_per_day).toFixed(2))

    // Update issue record
    await client.query(`
      UPDATE book_issues
      SET return_date=$1, fine_amount=$2, fine_paid=$3, returned_by=$4
      WHERE id=$5
    `, [
      today.toISOString().split('T')[0],
      fine,
      fine_paid || fine === 0,
      req.user.id,
      issueId,
    ])

    // Increment available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id=$1',
      [issue.book_id]
    )

    await client.query('COMMIT')

    // Get book title for response
    const bookResult = await pool.query(
      'SELECT title FROM books WHERE id=$1', [issue.book_id]
    )

    res.json({
      message:      `Book returned successfully.`,
      book_title:   bookResult.rows[0]?.title,
      overdue_days: overdue,
      fine_amount:  fine,
      fine_paid:    fine_paid || fine === 0,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Failed to return book.' })
  } finally {
    client.release()
  }
}

// ── GET /api/library/issued ───────────────────────────────────────────
const getIssuedBooks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        bi.*,
        b.title        AS book_title,
        b.author       AS book_author,
        b.isbn,
        u.name         AS student_name,
        s.roll_no,
        c.name         AS class_name,
        c.section,
        -- Calculate current fine even if not returned
        CASE
          WHEN bi.return_date IS NULL AND CURRENT_DATE > bi.due_date
          THEN (CURRENT_DATE - bi.due_date) * bi.fine_per_day
          ELSE 0
        END AS current_fine,
        CASE
          WHEN bi.return_date IS NULL AND CURRENT_DATE > bi.due_date
          THEN TRUE ELSE FALSE
        END AS is_overdue,
        CASE
          WHEN bi.return_date IS NULL
          THEN (bi.due_date - CURRENT_DATE)
          ELSE NULL
        END AS days_remaining
      FROM book_issues bi
      JOIN books    b  ON bi.book_id    = b.id
      JOIN students s  ON bi.student_id = s.id
      JOIN users    u  ON s.user_id     = u.id
      JOIN classes  c  ON s.class_id    = c.id
      WHERE bi.return_date IS NULL
      ORDER BY bi.due_date ASC
    `)

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issued books.' })
  }
}

// ── GET /api/library/overdue ──────────────────────────────────────────
const getOverdueBooks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        bi.*,
        b.title        AS book_title,
        b.author       AS book_author,
        u.name         AS student_name,
        s.roll_no,
        c.name         AS class_name,
        c.section,
        s.guardian_phone,
        s.guardian_email,
        (CURRENT_DATE - bi.due_date)       AS overdue_days,
        (CURRENT_DATE - bi.due_date) * bi.fine_per_day AS accrued_fine
      FROM book_issues bi
      JOIN books    b  ON bi.book_id    = b.id
      JOIN students s  ON bi.student_id = s.id
      JOIN users    u  ON s.user_id     = u.id
      JOIN classes  c  ON s.class_id    = c.id
      WHERE bi.return_date IS NULL
        AND bi.due_date < CURRENT_DATE
      ORDER BY bi.due_date ASC
    `)

    res.json({
      count:       result.rows.length,
      total_fine:  result.rows.reduce((s, r) => s + parseFloat(r.accrued_fine || 0), 0),
      records:     result.rows,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch overdue books.' })
  }
}

// ── GET /api/library/student/:studentId ──────────────────────────────
const getStudentHistory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        bi.*,
        b.title    AS book_title,
        b.author   AS book_author,
        b.isbn,
        b.category
      FROM book_issues bi
      JOIN books b ON bi.book_id = b.id
      WHERE bi.student_id = $1
      ORDER BY bi.issue_date DESC
    `, [req.params.studentId])

    const summary = {
      total_borrowed: result.rows.length,
      currently_held: result.rows.filter(r => !r.return_date).length,
      total_fine:     result.rows.reduce((s, r) => s + parseFloat(r.fine_amount || 0), 0),
      fine_paid:      result.rows.filter(r => r.fine_paid).reduce((s, r) => s + parseFloat(r.fine_amount || 0), 0),
    }

    res.json({ summary, records: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student history.' })
  }
}

module.exports = {
  getAllBooks,
  addBook,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  getIssuedBooks,
  getOverdueBooks,
  getStudentHistory,
}