import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import { fetchTimetableByClass, assignPeriod, deletePeriod } from '../../api/timetable.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DAY_COLORS = {
  Monday:    'bg-blue-50 text-blue-700 border-blue-200',
  Tuesday:   'bg-purple-50 text-purple-700 border-purple-200',
  Wednesday: 'bg-green-50 text-green-700 border-green-200',
  Thursday:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  Friday:    'bg-pink-50 text-pink-700 border-pink-200',
  Saturday:  'bg-orange-50 text-orange-700 border-orange-200',
}

// ── Draggable Subject Card ─────────────────────────────────────────────
function SubjectCard({ subject, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `subject-${subject.id}`,
    data: { type: 'subject', subject },
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing select-none
        ${isDragging
          ? 'opacity-40'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}
        transition-all
      `}
    >
      <p className="text-xs font-semibold text-gray-800">{subject.name}</p>
      <p className="text-xs text-gray-400">{subject.code}</p>
      {subject.teacher_name && (
        <p className="text-xs text-blue-500 mt-0.5">{subject.teacher_name}</p>
      )}
    </div>
  )
}

// ── Droppable Period Cell ──────────────────────────────────────────────
function PeriodCell({ day, period, entry, onRemove }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${day}-${period.period_no}`,
    data: { type: 'cell', day, period_no: period.period_no },
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[72px] rounded-lg border-2 border-dashed p-1.5 transition-all relative
        ${isOver
          ? 'border-blue-400 bg-blue-50 scale-[1.02]'
          : entry
            ? 'border-transparent bg-white shadow-sm'
            : 'border-gray-200 bg-gray-50 hover:border-gray-300'}
      `}
    >
      {entry ? (
        <div className="h-full flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-800 leading-tight">
              {entry.subject_name}
            </p>
            <p className="text-xs text-gray-400">{entry.subject_code}</p>
            <p className="text-xs text-blue-500 mt-0.5 truncate">{entry.teacher_name}</p>
          </div>
          <button
            onClick={() => onRemove(entry.id)}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-100 text-red-400
                       hover:bg-red-200 text-xs flex items-center justify-center"
            title="Remove"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-xs text-gray-300">Drop here</p>
        </div>
      )}
    </div>
  )
}

// ── Drag Overlay Preview ───────────────────────────────────────────────
function DragPreview({ subject }) {
  if (!subject) return null
  return (
    <div className="px-3 py-2 rounded-lg border border-blue-300 bg-white shadow-lg rotate-2 opacity-95">
      <p className="text-xs font-semibold text-gray-800">{subject.name}</p>
      <p className="text-xs text-gray-400">{subject.code}</p>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function TimetableBuilder() {
  const qc = useQueryClient()
  const [selectedClassId, setSelectedClassId] = useState('')
  const [activeSubject, setActiveSubject] = useState(null)
  const [conflictError, setConflictError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Fetch data
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const { data: timetableData, isLoading: ttLoading } = useQuery({
    queryKey: ['timetable', selectedClassId],
    queryFn: () => fetchTimetableByClass(selectedClassId),
    enabled: !!selectedClassId,
  })

  const { data: subjectsData = [] } = useQuery({
    queryKey: ['class-subjects', selectedClassId],
    queryFn: () => api.get(`/classes/${selectedClassId}/subjects`).then(r => r.data),
    enabled: !!selectedClassId,
  })

  const assignMutation = useMutation({
    mutationFn: assignPeriod,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable', selectedClassId] })
      setConflictError('')
    },
    onError: (err) => {
      setConflictError(err.response?.data?.error || 'Failed to assign period.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePeriod,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', selectedClassId] }),
  })

  // Build lookup: { "Monday-1": { ...entry } }
  const timetableMap = {}
  timetableData?.timetable?.forEach(entry => {
    timetableMap[`${entry.day}-${entry.period_no}`] = entry
  })

  const periods = timetableData?.periods || []

  const handleDragStart = (event) => {
    const { data } = event.active
    if (data.current?.type === 'subject') {
      setActiveSubject(data.current.subject)
    }
  }

  const handleDragEnd = (event) => {
    setActiveSubject(null)
    const { active, over } = event

    if (!over) return

    const dragData = active.data.current
    const dropData = over.data.current

    if (dragData?.type !== 'subject' || dropData?.type !== 'cell') return

    const subject = dragData.subject
    const { day, period_no } = dropData

    if (!subject.teacher_id) {
      setConflictError(`"${subject.name}" has no teacher assigned. Assign a teacher first.`)
      return
    }

    assignMutation.mutate({
      class_id:   parseInt(selectedClassId),
      subject_id: subject.id,
      teacher_id: subject.teacher_id,
      day,
      period_no,
    })
  }

  return (
  <DashboardLayout title="Timetable Builder">
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Timetable Builder</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Drag subjects into period slots to build the weekly schedule
          </p>
        </div>

        {/* Class selector */}
        <select
          value={selectedClassId}
          onChange={e => {
            setSelectedClassId(e.target.value)
            setConflictError('')
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a class...</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.section}
            </option>
          ))}
        </select>
      </div>

      {/* Conflict error */}
      {conflictError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center justify-between">
          <span>⚠️ {conflictError}</span>
          <button onClick={() => setConflictError('')} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {!selectedClassId ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">Select a class to start building its timetable</p>
        </div>
      ) : ttLoading ? (
        <p className="text-gray-400 text-sm py-12 text-center">Loading timetable...</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6">
            {/* ── Left: Subject palette ── */}
            <div className="w-44 shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Subjects
              </p>
              <div className="space-y-2">
                {subjectsData.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No subjects found for this class.
                    <br />Add subjects first.
                  </p>
                ) : (
                  subjectsData.map(sub => (
                    <SubjectCard
                      key={sub.id}
                      subject={sub}
                      isDragging={activeSubject?.id === sub.id}
                    />
                  ))
                )}
              </div>

              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">How to use</p>
                <p className="text-xs text-blue-500 leading-relaxed">
                  Drag a subject card and drop it into any period cell on the grid.
                  Drop again to replace.
                </p>
              </div>
            </div>

            {/* ── Right: Timetable grid ── */}
            <div className="flex-1 overflow-x-auto">
              {periods.length === 0 ? (
                <p className="text-gray-400 text-sm">No period config found.</p>
              ) : (
                <table className="w-full border-separate border-spacing-1 min-w-[700px]">
                  <thead>
                    <tr>
                      {/* Period header column */}
                      <th className="w-24 text-left">
                        <span className="text-xs text-gray-400 font-medium">Period</span>
                      </th>
                      {DAYS.map(day => (
                        <th key={day} className="text-center min-w-[110px]">
                          <span className={`
                            inline-block px-3 py-1 rounded-full text-xs font-semibold border
                            ${DAY_COLORS[day]}
                          `}>
                            {day}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(period => (
                      <tr key={period.period_no}>
                        {/* Period label */}
                        <td className="pr-2 align-top pt-1">
                          <div className="text-right">
                            <p className="text-xs font-semibold text-gray-700">
                              P{period.period_no}
                            </p>
                            <p className="text-xs text-gray-400">
                              {String(period.start_time).slice(0, 5)}
                            </p>
                            <p className="text-xs text-gray-300">
                              {String(period.end_time).slice(0, 5)}
                            </p>
                          </div>
                        </td>

                        {/* Day cells */}
                        {DAYS.map(day => (
                          <td key={day} className="align-top">
                            <PeriodCell
                              day={day}
                              period={period}
                              entry={timetableMap[`${day}-${period.period_no}`]}
                              onRemove={(id) => deleteMutation.mutate(id)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            <DragPreview subject={activeSubject} />
          </DragOverlay>
        </DndContext>
      )}
       </div>
  </DashboardLayout>
)
}