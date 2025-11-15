// frontend/src/components/Dashboard.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { queryAPI, authAPI } from '../services/api';
import { 
  Inbox, Search, Filter, Plus, LogOut, 
  AlertCircle, Clock, CheckCircle, User,
  Mail, MessageSquare, Facebook, Twitter, Instagram
} from 'lucide-react';
import QueryList from './QueryList';
import QueryDetail from './QueryDetail';
import NewQueryForm from './NewQueryForm';
import NotificationBell from './NotificationBell';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connected } = useSocket(); // ✅ MOVED INSIDE COMPONENT
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewQuery, setShowNewQuery] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    source: '',
    search: ''
  });

  useEffect(() => {
    loadQueries();
    loadUsers();
  }, [filters]);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const response = await queryAPI.getAll(filters);
      setQueries(response.data.data);
    } catch (error) {
      console.error('Error loading queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQueryClick = (query) => {
    setSelectedQuery(query);
  };

  const handleQueryUpdate = () => {
    loadQueries();
    if (selectedQuery) {
      queryAPI.getById(selectedQuery._id).then((response) => {
        setSelectedQuery(response.data.data);
      });
    }
  };

  const handleNewQuery = async (queryData) => {
    try {
      await queryAPI.create(queryData);
      setShowNewQuery(false);
      loadQueries();
    } catch (error) {
      console.error('Error creating query:', error);
      alert('Failed to create query');
    }
  };

  const getSourceIcon = (source) => {
    const icons = {
      email: <Mail size={16} />,
      chat: <MessageSquare size={16} />,
      facebook: <Facebook size={16} />,
      twitter: <Twitter size={16} />,
      instagram: <Instagram size={16} />
    };
    return icons[source] || <Inbox size={16} />;
  };

  const stats = {
    new: queries.filter(q => q.status === 'new').length,
    inProgress: queries.filter(q => q.status === 'in-progress').length,
    resolved: queries.filter(q => q.status === 'resolved').length,
    urgent: queries.filter(q => q.priority === 5).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Inbox className="text-blue-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">Query Management</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Real-time Status Indicator */}
            {connected && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">Live</span>
              </div>
            )}
            
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* User Info */}
            <div className="flex items-center gap-2 text-sm">
              <User size={20} className="text-gray-600" />
              <span className="text-gray-700 font-medium">{user?.name}</span>
              <span className="text-gray-500">({user?.role})</span>
            </div>
            
            {/* Analytics Button */}
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              Analytics
            </button>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar - Query List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Stats */}
          <div className="p-4 grid grid-cols-2 gap-3 border-b border-gray-200">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 mb-1">
                <Clock size={16} />
                <span className="text-xs font-medium">New</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{stats.new}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <AlertCircle size={16} />
                <span className="text-xs font-medium">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <CheckCircle size={16} />
                <span className="text-xs font-medium">Resolved</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <AlertCircle size={16} />
                <span className="text-xs font-medium">Urgent</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{stats.urgent}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search queries..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                <option value="5">Urgent (5)</option>
                <option value="4">High (4)</option>
                <option value="3">Medium (3)</option>
                <option value="2">Low (2)</option>
                <option value="1">Very Low (1)</option>
              </select>
            </div>

            <button
              onClick={() => setShowNewQuery(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus size={20} />
              New Query
            </button>
          </div>

          {/* Query List */}
          <QueryList
            queries={queries}
            selectedQuery={selectedQuery}
            onQueryClick={handleQueryClick}
            loading={loading}
            getSourceIcon={getSourceIcon}
          />
        </div>

        {/* Main Content - Query Detail */}
        <div className="flex-1 overflow-auto">
          {selectedQuery ? (
            <QueryDetail
              query={selectedQuery}
              users={users}
              onUpdate={handleQueryUpdate}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Inbox size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a query to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Query Modal */}
      {showNewQuery && (
        <NewQueryForm
          onClose={() => setShowNewQuery(false)}
          onSubmit={handleNewQuery}
        />
      )}
    </div>
  );
};

export default Dashboard;