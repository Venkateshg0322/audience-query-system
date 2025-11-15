// frontend/src/components/QueryDetail.jsx
import React, { useState } from 'react';
import { queryAPI } from '../services/api';
import {
  Mail, Phone, Calendar, User, AlertTriangle,
  CheckCircle, Clock, MessageSquare, Send
} from 'lucide-react';

const QueryDetail = ({ query, users, onUpdate }) => {
  const [status, setStatus] = useState(query.status);
  const [assignedTo, setAssignedTo] = useState(query.assignedTo?._id || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);
      await queryAPI.updateStatus(query._id, newStatus);
      setStatus(newStatus);
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async (userId) => {
    try {
      setLoading(true);
      await queryAPI.assignQuery(query._id, userId);
      setAssignedTo(userId);
      onUpdate();
    } catch (error) {
      console.error('Error assigning query:', error);
      alert('Failed to assign query');
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (window.confirm('Are you sure you want to escalate this query?')) {
      try {
        setLoading(true);
        await queryAPI.escalate(query._id);
        onUpdate();
      } catch (error) {
        console.error('Error escalating query:', error);
        alert('Failed to escalate query');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    try {
      setLoading(true);
      await queryAPI.addNote(query._id, note);
      setNote('');
      onUpdate();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      5: { text: 'Urgent', color: 'bg-red-600' },
      4: { text: 'High', color: 'bg-orange-600' },
      3: { text: 'Medium', color: 'bg-yellow-600' },
      2: { text: 'Low', color: 'bg-blue-600' },
      1: { text: 'Very Low', color: 'bg-gray-600' }
    };
    return labels[priority] || labels[3];
  };

  const priorityInfo = getPriorityLabel(query.priority);

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {query.subject}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${priorityInfo.color}`}>
                  {priorityInfo.text} Priority
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {query.category}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  {query.source}
                </span>
                {query.isEscalated && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    Escalated
                  </span>
                )}
              </div>
            </div>
            {!query.isEscalated && (
              <button
                onClick={handleEscalate}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Escalate
              </button>
            )}
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User size={18} />
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">{query.customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={18} />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{query.customerEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={18} />
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(query.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Message</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{query.message}</p>
        </div>

        {/* Assignment & Status */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <select
                value={assignedTo}
                onChange={(e) => handleAssignment(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="new">New</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            Internal Notes
          </h3>

          {/* Existing Notes */}
          {query.notes && query.notes.length > 0 ? (
            <div className="space-y-3 mb-4">
              {query.notes.map((note, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {note.addedBy?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(note.addedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No notes yet</p>
          )}

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !note.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={18} />
              Add Note
            </button>
          </form>
        </div>

        {/* Response Time (if resolved) */}
        {query.responseTime && (
          <div className="p-6 bg-green-50 border-t border-green-100">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span className="font-medium">
                Resolved in {Math.floor(query.responseTime / 60)} hours {query.responseTime % 60} minutes
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryDetail;