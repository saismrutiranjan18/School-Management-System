import { useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClasses } from '../../api/classes.api'
import { fetchTimetableByClass, assignPeriod, deletePeriod } from '../../api/timetable.api'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import { Select } from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Calendar, AlertCircle, GripVertical, X, Info } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_VARIANT = { Monday: 'info', Tuesday: 'purple', Wednesday: 'success', Thursday: 'warning', Friday: 'primary', Saturday: 'danger' }

function SubjectCard({ subject, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `subject-${subject.id}`, data: { type: 'subject', subject },
  })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : {}

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={`px-3 py-2.5 rounded-xl border cursor-grab active:cursor-grabbing select-none transition-all
        ${isDragging ? 'opacity-40' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm'}`}>
      <div className="flex items-center gap-2">
        <GripVertical size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{subject.name}</p>
          <p className="text-[10px] text-slate-400">{subject.code}</p>
          {subject.teacher_name && <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-0.5 truncate">{subject.teacher_name}</p>}
        </div>
      </div>
    </div>
  )
}

function PeriodCell({ day, period, entry, onRemove }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${day}-${period.period_no}`, data: { type: 'cell', day, period_no: period.period_no },
  })

  return (
    <div ref={setNodeRef}
      className={`min-h-[72px] rounded-xl border-2 border-dashed p-1.5 transition-all relative
        ${isOver ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
          : entry ? 'border-transparent bg-white dark:bg-slate-800 shadow-sm hover:shadow-md'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600'}`}>
      {entry ? (
        <div className="h-full flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">{entry.subject_name}</p>
            <p className="text-[10px] text-slate-400">{entry.subject_code}</p>
            <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-0.5 truncate">{entry.teacher_name}</p>
          </div>
          <button onClick={() => onRemove(entry.id)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors" title="Remove">
            <X size={10} />
          </button>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-xs text-slate-300 dark:text-slate-600">Drop here</p>
        </div>
      )}
    </div>
  )
}

function DragPreview({ subject }) {
  if (!subject) return null
  return (
    <div className="px-3 py-2 rounded-xl border border-primary-300 bg-white dark:bg-slate-800 shadow-lg rotate-2 opacity-95">
      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{subject.name}</p>
      <p className="text-[10px] text-slate-400">{subject.code}</p>
    </div>
  )
}

export default function TimetableBuilder() {
  const qc = useQueryClient()
  const [selectedClassId, setSelectedClassId] = useState('')
  const [activeSubject, setActiveSubject] = useState(null)
  const [conflictError, setConflictError] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses })
  const { data: timetableData, isLoading: ttLoading } = useQuery({
    queryKey: ['timetable', selectedClassId], queryFn: () => fetchTimetableByClass(selectedClassId), enabled: !!selectedClassId,
  })
  const { data: subjectsData = [] } = useQuery({
    queryKey: ['class-subjects', selectedClassId], queryFn: () => api.get(`/classes/${selectedClassId}/subjects`).then(r => r.data), enabled: !!selectedClassId,
  })

  const assignMutation = useMutation({
    mutationFn: assignPeriod,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetable', selectedClassId] }); setConflictError('') },
    onError: (err) => setConflictError(err.response?.data?.error || 'Failed to assign period.'),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePeriod,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', selectedClassId] }),
  })

  const timetableMap = {}
  timetableData?.timetable?.forEach(entry => { timetableMap[`${entry.day}-${entry.period_no}`] = entry })
  const periods = timetableData?.periods || []

  const handleDragStart = (event) => {
    if (event.active.data.current?.type === 'subject') setActiveSubject(event.active.data.current.subject)
  }

  const handleDragEnd = (event) => {
    setActiveSubject(null)
    const { active, over } = event
    if (!over) return
    const dragData = active.data.current, dropData = over.data.current
    if (dragData?.type !== 'subject' || dropData?.type !== 'cell') return
    const subject = dragData.subject
    if (!subject.teacher_id) { setConflictError(`"${subject.name}" has no teacher assigned.`); return }
    assignMutation.mutate({ class_id: parseInt(selectedClassId), subject_id: subject.id, teacher_id: subject.teacher_id, day: dropData.day, period_no: dropData.period_no })
  }

  return (
    <DashboardLayout title="Timetable Builder">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Timetable Builder</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Drag subjects into period slots to build the weekly schedule</p>
          </div>
          <Select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setConflictError('') }} containerClass="w-52">
            <option value="">Select a class…</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
          </Select>
        </div>

        {conflictError && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-xl">
            <span className="flex items-center gap-2"><AlertCircle size={15} className="shrink-0" /> {conflictError}</span>
            <button onClick={() => setConflictError('')} className="text-red-400 hover:text-red-600 shrink-0"><X size={14} /></button>
          </div>
        )}

        {!selectedClassId ? (
          <Card>
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
              <Calendar size={48} className="opacity-30" />
              <p className="text-sm">Select a class to start building its timetable</p>
            </div>
          </Card>
        ) : ttLoading ? (
          <Card><p className="text-sm text-slate-400 text-center py-12">Loading timetable…</p></Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-6">
              {/* Subject palette */}
              <div className="w-48 shrink-0 space-y-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subjects</p>
                <div className="space-y-2">
                  {subjectsData.length === 0 ? (
                    <p className="text-xs text-slate-400">No subjects found. Add subjects first.</p>
                  ) : subjectsData.map(sub => (
                    <SubjectCard key={sub.id} subject={sub} isDragging={activeSubject?.id === sub.id} />
                  ))}
                </div>
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/30">
                  <p className="text-xs text-primary-700 dark:text-primary-300 font-medium mb-1 flex items-center gap-1.5"><Info size={12} /> How to use</p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 leading-relaxed">
                    Drag a subject card and drop it into any period cell. Drop again to replace.
                  </p>
                </div>
              </div>

              {/* Timetable grid */}
              <Card padding="none" className="flex-1">
                <div className="overflow-x-auto p-4">
                  {periods.length === 0 ? (
                    <p className="text-sm text-slate-400">No period config found.</p>
                  ) : (
                    <table className="w-full border-separate border-spacing-1.5 min-w-[700px]">
                      <thead>
                        <tr>
                          <th className="w-24 text-left"><span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Period</span></th>
                          {DAYS.map(day => <th key={day} className="text-center min-w-[110px]"><Badge variant={DAY_VARIANT[day]}>{day}</Badge></th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map(period => (
                          <tr key={period.period_no}>
                            <td className="pr-2 align-top pt-1">
                              <div className="text-right">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">P{period.period_no}</p>
                                <p className="text-[10px] text-slate-400">{String(period.start_time).slice(0, 5)}</p>
                                <p className="text-[10px] text-slate-300 dark:text-slate-600">{String(period.end_time).slice(0, 5)}</p>
                              </div>
                            </td>
                            {DAYS.map(day => (
                              <td key={day} className="align-top">
                                <PeriodCell day={day} period={period} entry={timetableMap[`${day}-${period.period_no}`]} onRemove={(id) => deleteMutation.mutate(id)} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </div>
            <DragOverlay><DragPreview subject={activeSubject} /></DragOverlay>
          </DndContext>
        )}
      </div>
    </DashboardLayout>
  )
}