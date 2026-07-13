import { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Card from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Calendar, BookOpen, FileText, PartyPopper } from 'lucide-react'

const EVENTS = [
  { title: 'Parent-Teacher Meeting', icon: BookOpen, date: '2025-02-15', color: 'from-blue-500 to-indigo-600' },
  { title: 'Mid-Term Examination',  icon: FileText,  date: '2025-03-01', color: 'from-amber-400 to-orange-500' },
  { title: 'Annual Day Celebration', icon: PartyPopper, date: '2025-03-20', color: 'from-pink-500 to-rose-600' },
]

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <DashboardLayout title="Calendar">
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">School Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">View important dates and upcoming events</p>
        </div>

        <Card>
          <Input label="Select Date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} containerClass="max-w-xs" />
          <div className="mt-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Selected Date: <strong className="text-slate-800 dark:text-slate-100">{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</strong>
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {EVENTS.map((evt, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:shadow-sm transition-all">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${evt.color} flex items-center justify-center shrink-0`}>
                  <evt.icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{evt.title}</p>
                  <p className="text-xs text-slate-400">{new Date(evt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}