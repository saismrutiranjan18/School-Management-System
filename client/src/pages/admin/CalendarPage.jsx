import { useState } from "react";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">School Calendar</h1>

      <div className="bg-white shadow rounded-lg p-4">
        <label className="block text-sm font-medium mb-2">
          Select Date
        </label>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-3 py-2"
        />

        <div className="mt-4">
          <p className="text-gray-600">
            Selected Date: <strong>{selectedDate}</strong>
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Upcoming Events</h2>

        <ul className="space-y-2">
          <li className="border-b pb-2">
            📚 Parent-Teacher Meeting
          </li>
          <li className="border-b pb-2">
            📝 Mid-Term Examination
          </li>
          <li className="border-b pb-2">
            🎉 Annual Day Celebration
          </li>
        </ul>
      </div>
    </div>
  );
}