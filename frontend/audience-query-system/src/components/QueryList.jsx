// frontend/src/components/QueryList.jsx
import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

const QueryList = ({ queries, selectedQuery, onQueryClick, loading, getSourceIcon }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      5: 'bg-red-100 text-red-700 border-red-200',
      4: 'bg-orange-100 text-orange-700 border-orange-200',
      3: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      2: 'bg-blue-100 text-blue-700 border-blue-200',
      1: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[priority] || colors[3];
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-purple-100 text-purple-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.new;
  };

  const getCategoryColor = (category) => {
    const colors = {
      complaint: 'bg-red-100 text-red-700',
      urgent: 'bg-red-100 text-red-700',
      question: 'bg-blue-100 text-blue-700',
      request: 'bg-purple-100 text-purple-700',
      feedback: 'bg-green-100 text-green-700',
      general: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.general;
  };

  const formatDate = (date) => {
    const now = new Date();
    const queryDate = new Date(date);
    const diffMs = now - queryDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return queryDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading queries...</div>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>No queries found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {queries.map((query) => (
        <div
          key={query._id}
          onClick={() => onQueryClick(query)}
          className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition ${
            selectedQuery?._id === query._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${getCategoryColor(query.category)}`}>
                {getSourceIcon(query.source)}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                {query.subject}
              </h3>
            </div>
            {query.isEscalated && (
              <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
            )}
          </div>

          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {query.message}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(query.status)}`}>
              {query.status}
            </span>
            <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(query.priority)}`}>
              P{query.priority}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(query.category)}`}>
              {query.category}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>{query.customerName}</span>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(query.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QueryList;