/**
 * Builder Dashboard Component - Enterprise Feature
 */

import React, { useState } from 'react';
import { Project } from '../types';

interface BuilderDashboardProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onNewProject: () => void;
  onBack: () => void;
  companyName?: string;
}

type ProjectStatus = 'all' | 'design' | 'approved' | 'building' | 'complete';

export const BuilderDashboard: React.FC<BuilderDashboardProps> = ({
  projects,
  onProjectSelect,
  onNewProject,
  onBack,
  companyName = 'Your Company'
}) => {
  const [filter, setFilter] = useState<ProjectStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'design': return 'bg-amber-500/20 text-amber-500';
      case 'approved': return 'bg-emerald-500/20 text-emerald-500';
      case 'building': return 'bg-blue-500/20 text-blue-500';
      case 'complete': return 'bg-zinc-500/20 text-zinc-400';
      default: return 'bg-amber-500/20 text-amber-500';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'design': return 'IN DESIGN';
      case 'approved': return 'APPROVED';
      case 'building': return 'BUILDING';
      case 'complete': return 'COMPLETE';
      default: return 'IN DESIGN';
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter || (!p.status && filter === 'design');
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: projects.length,
    design: projects.filter(p => !p.status || p.status === 'design').length,
    approved: projects.filter(p => p.status === 'approved').length,
    building: projects.filter(p => p.status === 'building').length,
    complete: projects.filter(p => p.status === 'complete').length,
  };

  const totalRenders = projects.reduce((sum, p) => sum + (p.generatedRenderings?.length || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <button onClick={onBack} className="text-zinc-500 hover:text-white text-sm mb-2">
              <i className="fa-solid fa-arrow-left mr-2"></i>Back to Studio
            </button>
            <h1 className="text-2xl font-serif-display">{companyName}</h1>
            <p className="text-xs text-zinc-500 mt-1">
              {projects.length} Active Projects · {totalRenders} Renders This Month
            </p>
          </div>
          <button
            onClick={onNewProject}
            className="px-6 py-3 bg-amber-500 text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-all"
          >
            + New Project
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"></i>
            <input
              type="text"
              placeholder="Search projects, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {(['all', 'design', 'approved', 'building', 'complete'] as ProjectStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                  filter === status 
                    ? 'bg-white text-black' 
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                {status === 'all' ? 'All Projects' : status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
              </button>
            ))}
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <i className="fa-solid fa-folder-open text-4xl text-zinc-700 mb-4"></i>
              <p className="text-zinc-500">No projects found</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectSelect(project)}
                className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl hover:bg-zinc-900 transition-all cursor-pointer border border-transparent hover:border-white/10"
              >
                {/* Thumbnail */}
                <div className="w-20 h-14 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                  {project.generatedRenderings?.[0] || project.imageUrl ? (
                    <img
                      src={project.generatedRenderings?.[0] || project.imageUrl}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fa-solid fa-house text-zinc-600"></i>
                    </div>
                  )}
                </div>

                {/* Project Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{project.name}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {project.clientName || 'No client assigned'}
                  </p>
                </div>

                {/* Status */}
                <div className="text-right shrink-0">
                  <span className={`px-3 py-1 text-[10px] font-black rounded-full ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                  <p className="text-xs text-zinc-500 mt-1">
                    {project.generatedRenderings?.length || 0} renders
                  </p>
                </div>

                {/* Client Info */}
                <div className="shrink-0 text-right hidden md:block">
                  <p className="text-sm">{project.clientName || '-'}</p>
                  <p className="text-xs text-zinc-500">{project.clientEmail || '-'}</p>
                </div>

                {/* Offline Status */}
                {project.isOfflineCached && (
                  <div className="shrink-0">
                    <i className="fa-solid fa-cloud-arrow-down text-emerald-500" title="Cached offline"></i>
                  </div>
                )}

                {/* Actions */}
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="shrink-0 w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white"
                >
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pagination placeholder */}
        {filteredProjects.length > 10 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <p className="text-xs text-zinc-500">Showing {filteredProjects.length} projects</p>
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center border border-white/10 rounded text-zinc-500 hover:border-white hover:text-white">
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-amber-500 text-black rounded text-xs font-bold">1</button>
              <button className="w-8 h-8 flex items-center justify-center border border-white/10 rounded text-zinc-500 hover:border-white hover:text-white">
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuilderDashboard;
