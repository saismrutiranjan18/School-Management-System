const pool = require("../config/db");

const getDashboard = async (req, res) => {
  const { role, id: userId } = req.user;

  try {
    if (role === "admin") {
      const data = await getAdminDashboard();
      return res.json(data);
    }
    if (role === "teacher") {
      const data = await getTeacherDashboard(userId);
      return res.json(data);
    }
    if (role === "student") {
      const data = await getStudentDashboard(userId);
      return res.json(data);
    }
    if (role === "parent") {
      const data = await getParentDashboard(userId);
      return res.json(data);
    }
    res.status(403).json({ error: "Unauthorized role." });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data." });
  }
};

// ── Admin Dashboard ───────────────────────────────────────────────────
const getAdminDashboard = async () => {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 8) + "01";

  const [
    summaryResult,
    monthlyFeesResult,
    attendanceTrendResult,
    classPerformanceResult,
    toppersResult,
    recentPaymentsResult,
    upcomingEventsResult,
    feeStatsResult,
    moduleStatsResult,
  ] = await Promise.all([
    // ── Summary cards ──────────────────────────────────────────────
    pool.query(
      `SELECT
        (SELECT COUNT(*) FROM students)                       AS total_students,
        (SELECT COUNT(*) FROM teachers)                       AS total_teachers,
        (SELECT COUNT(*) FROM classes)                        AS total_classes,
        (SELECT COUNT(*) FROM users WHERE role='parent')      AS total_parents,
        (SELECT COALESCE(SUM(amount),0) FROM fee_payments
          WHERE payment_date = CURRENT_DATE)                  AS fees_today,
        (SELECT COALESCE(SUM(amount),0) FROM fee_payments
          WHERE payment_date BETWEEN $1 AND $2)               AS fees_this_month,
        (SELECT COUNT(*) FROM books)                          AS total_books,
        (SELECT COUNT(*) FROM book_issues
          WHERE return_date IS NULL)                          AS books_issued`,
      [monthStart, today]
    ),

    // ── Monthly fee collection (last 6 months) ─────────────────────
    pool.query(`
      SELECT
        TO_CHAR(payment_date, 'Mon YYYY') AS month,
        TO_CHAR(payment_date, 'YYYY-MM')  AS month_key,
        SUM(amount)                        AS collected
      FROM fee_payments
      WHERE payment_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month, month_key
      ORDER BY month_key ASC
    `),

    // ── Attendance trend (last 7 days) ─────────────────────────────
    pool.query(`
      SELECT
        TO_CHAR(date, 'DD Mon') AS day,
        date::text              AS date_key,
        COUNT(*)                AS total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'absent'  THEN 1 ELSE 0 END) AS absent,
        ROUND(
          SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END)
          * 100.0 / NULLIF(COUNT(*),0), 1
        ) AS percentage
      FROM attendance
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY day, date_key
      ORDER BY date_key ASC
    `),

    // ── Class-wise performance (latest exam average) ───────────────
    pool.query(`
      SELECT
        c.name   AS class_name,
        c.section,
        e.name   AS exam_name,
        ROUND(
          AVG((m.marks_obtained::float / NULLIF(m.max_marks,0)) * 100)::numeric,
          1
        ) AS avg_percentage,
        COUNT(DISTINCT m.student_id) AS student_count
      FROM marks m
      JOIN exams e    ON m.exam_id    = e.id
      JOIN students s ON m.student_id = s.id
      JOIN classes  c ON s.class_id   = c.id
      WHERE e.id = (
        SELECT id FROM exams ORDER BY created_at DESC LIMIT 1
      )
      AND m.is_absent = FALSE
      GROUP BY c.name, c.section, e.name
      ORDER BY avg_percentage DESC
    `),

    // ── Toppers (top 5 students in latest exam) ────────────────────
    // FIX: was accidentally using attendance formula here
    pool.query(`
      SELECT
        u.name      AS student_name,
        c.name      AS class_name,
        c.section,
        ROUND(
          (SUM(m.marks_obtained)::float / NULLIF(SUM(m.max_marks), 0) * 100)::numeric,
          1
        ) AS percentage,
        SUM(m.marks_obtained) AS total_obtained,
        SUM(m.max_marks)      AS total_max
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN users    u ON s.user_id    = u.id
      JOIN classes  c ON s.class_id   = c.id
      WHERE m.exam_id = (
        SELECT id FROM exams ORDER BY created_at DESC LIMIT 1
      )
      AND m.is_absent = FALSE
      GROUP BY u.name, c.name, c.section
      ORDER BY percentage DESC
      LIMIT 5
    `),

    // ── Recent fee payments (last 5) ───────────────────────────────
    pool.query(`
      SELECT
        fp.receipt_no,
        fp.amount,
        fp.fee_type,
        fp.payment_date,
        fp.method,
        u.name AS student_name
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      JOIN users    u ON s.user_id     = u.id
      ORDER BY fp.created_at DESC
      LIMIT 5
    `),

    // ── Upcoming events (next 5) ───────────────────────────────────
    pool.query(`
      SELECT id, title, event_date, event_type, is_holiday
      FROM events
      WHERE event_date >= CURRENT_DATE
      ORDER BY event_date ASC
      LIMIT 5
    `),

    // ── Fee stats ──────────────────────────────────────────────────
    pool.query(`
      SELECT
        COALESCE(SUM(fp.amount), 0) AS total_collected,
        COALESCE(
          (SELECT SUM(fs.amount) FROM fees_structure fs
           WHERE fs.academic_year = '2024-25') - SUM(fp.amount),
          0
        ) AS total_outstanding
      FROM fee_payments fp
      WHERE fp.academic_year = '2024-25'
    `),

    // ── Module stats ───────────────────────────────────────────────
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM announcements WHERE is_active=TRUE)  AS active_announcements,
        (SELECT COUNT(*) FROM book_issues
          WHERE due_date < CURRENT_DATE AND return_date IS NULL)   AS overdue_books,
        (SELECT COUNT(*) FROM transport_routes WHERE is_active=TRUE) AS active_routes,
        (SELECT COUNT(*) FROM exams WHERE end_date >= CURRENT_DATE) AS upcoming_exams
    `),
  ]);

  return {
    role: "admin",
    summary: summaryResult.rows[0],
    monthly_fees: monthlyFeesResult.rows,
    attendance_trend: attendanceTrendResult.rows,
    class_performance: classPerformanceResult.rows,
    toppers: toppersResult.rows,
    recent_payments: recentPaymentsResult.rows,
    upcoming_events: upcomingEventsResult.rows,
    fee_stats: feeStatsResult.rows[0],
    module_stats: moduleStatsResult.rows[0],
  };
};

// ── Teacher Dashboard ─────────────────────────────────────────────────
const getTeacherDashboard = async (userId) => {
  const today = new Date().toISOString().split("T")[0];

  const [teacherResult, classesResult, attendanceTodayResult, announcementsResult] =
    await Promise.all([
      pool.query("SELECT * FROM teachers WHERE user_id=$1", [userId]),

      pool.query(
        `SELECT DISTINCT
          c.id, c.name, c.section,
          COUNT(s.id) AS student_count
        FROM subjects sub
        JOIN classes  c ON sub.class_id   = c.id
        JOIN teachers t ON sub.teacher_id = t.id
        LEFT JOIN students s ON s.class_id = c.id
        WHERE t.user_id = $1
        GROUP BY c.id, c.name, c.section
        ORDER BY c.name`,
        [userId]
      ),

      pool.query(
        `SELECT
          COUNT(*)  AS total_marked,
          SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) AS present,
          SUM(CASE WHEN status='absent'  THEN 1 ELSE 0 END) AS absent
        FROM attendance a
        JOIN teachers t ON a.teacher_id = t.id
        WHERE t.user_id = $1 AND a.date = $2`,
        [userId, today]
      ),

      pool.query(`
        SELECT id, title, priority, created_at
        FROM announcements
        WHERE is_active = TRUE
          AND (target_role = 'all' OR target_role = 'teacher')
        ORDER BY created_at DESC
        LIMIT 5
      `),
    ]);

  return {
    role: "teacher",
    teacher: teacherResult.rows[0],
    my_classes: classesResult.rows,
    today_attendance: attendanceTodayResult.rows[0],
    announcements: announcementsResult.rows,
  };
};

// ── Student Dashboard ─────────────────────────────────────────────────
const getStudentDashboard = async (userId) => {
  const studentResult = await pool.query(
    `SELECT s.*, u.name, u.email,
            c.name AS class_name, c.section
     FROM students s
     JOIN users u   ON s.user_id  = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE s.user_id = $1`,
    [userId]
  );

  if (!studentResult.rows[0])
    return { role: "student", error: "Student not found" };

  const student = studentResult.rows[0];

  const [attendanceResult, marksResult, feesResult, announcementsResult] =
    await Promise.all([
      pool.query(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) AS attended,
          ROUND(
            SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END)
            * 100.0 / NULLIF(COUNT(*),0), 1
          ) AS percentage
        FROM attendance
        WHERE student_id = $1
          AND date >= CURRENT_DATE - INTERVAL '30 days'`,
        [student.id]
      ),

      pool.query(
        `SELECT
          e.name AS exam_name,
          ROUND(
            (SUM(m.marks_obtained) * 100.0 / NULLIF(SUM(m.max_marks), 0))::numeric,
            1
          ) AS percentage
        FROM marks m
        JOIN exams e ON m.exam_id = e.id
        WHERE m.student_id = $1
          AND m.is_absent = FALSE
          AND e.is_published = TRUE
        GROUP BY e.name, e.id
        ORDER BY e.id DESC
        LIMIT 3`,
        [student.id]
      ),

      pool.query(
        `SELECT
          COALESCE(SUM(fp.amount),0) AS paid,
          COALESCE(
            (SELECT SUM(fs.amount) FROM fees_structure fs
             WHERE fs.class_id = $2) - SUM(fp.amount),
            0
          ) AS balance
        FROM fee_payments fp
        WHERE fp.student_id = $1
          AND fp.academic_year = '2024-25'`,
        [student.id, student.class_id]
      ),

      pool.query(
        `SELECT id, title, priority, created_at
        FROM announcements
        WHERE is_active = TRUE
          AND (
            target_role = 'all'
            OR target_role = 'student'
            OR (target_class = $1 AND target_role = 'student')
          )
        ORDER BY created_at DESC
        LIMIT 5`,
        [student.class_id]
      ),
    ]);

  return {
    role: "student",
    student,
    attendance: attendanceResult.rows[0],
    recent_marks: marksResult.rows,
    fee_status: feesResult.rows[0],
    announcements: announcementsResult.rows,
  };
};

// ── Parent Dashboard ──────────────────────────────────────────────────
const getParentDashboard = async (userId) => {
  const userResult = await pool.query(
    "SELECT email FROM users WHERE id=$1", [userId]
  );
  if (!userResult.rows[0]) return { role: "parent", error: "User not found" };

  const parentEmail = userResult.rows[0].email;

  const studentResult = await pool.query(
    `SELECT s.*, u.name, c.name AS class_name, c.section
     FROM students s
     JOIN users u   ON s.user_id  = u.id
     JOIN classes c ON s.class_id = c.id
     WHERE s.guardian_email = $1
     LIMIT 1`,
    [parentEmail]
  );

  if (!studentResult.rows[0]) return { role: "parent", child: null };

  const child = studentResult.rows[0];
  const childDashboard = await getStudentDashboard(child.user_id);

  return {
    role: "parent",
    child: childDashboard,
  };
};

module.exports = { getDashboard };