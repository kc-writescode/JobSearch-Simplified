'use client';

import React from 'react';
import { VACoreTask, TaskStatus } from '@/types/admin.types';
import { Ban, FileText, ExternalLink } from 'lucide-react';

interface TasksDataTableProps {
  tasks: VACoreTask[];
  loading: boolean;
  onSelectTask: (task: VACoreTask) => void;
  selectedTaskId?: string;
  onCannotApply?: (task: VACoreTask) => void;
  showCannotApplyReason?: boolean;
  showProofColumn?: boolean;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'Applying':
      return 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm shadow-amber-50';
    case 'Applied':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-50';
    case 'Trashed':
      return 'bg-red-50 text-red-700 border-red-100 shadow-sm shadow-red-50';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

const getAIStatusBadge = (status: string) => {
  switch (status) {
    case 'Pending':
      return <span className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span> Pending</span>;
    case 'In Progress':
      return <span className="flex items-center gap-1.5 text-blue-600 font-bold uppercase text-[10px] tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span> In Ops</span>;
    case 'Completed':
      return <span className="flex items-center gap-1.5 text-emerald-600 font-bold uppercase text-[10px] tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Ready</span>;
    case 'Error':
      return <span className="flex items-center gap-1.5 text-rose-600 font-bold uppercase text-[10px] tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> Failed</span>;
    default:
      return status;
  }
};

export function TasksDataTable({
  tasks,
  loading,
  onSelectTask,
  selectedTaskId,
  onCannotApply,
  showCannotApplyReason,
  showProofColumn,
}: TasksDataTableProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20 bg-white/50 rounded-3xl border border-dashed border-slate-200">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-[3px] border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-sm font-bold text-slate-900 uppercase tracking-widest">Fetching Operations...</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-20 bg-white/50 rounded-3xl border border-dashed border-slate-200">
        <div className="text-center max-w-sm">
          <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          </div>
          <p className="text-xl font-black text-slate-900">Zero Active Missions</p>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            The protocol is clear. No applications match the current active reconnaissance filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                Job ID
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                Job Specification
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                Client Profile
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                Deadline
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                Phase
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                AI Process
              </th>
              {showProofColumn && (
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                  Proof
                </th>
              )}
              {showCannotApplyReason && (
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                  Reason
                </th>
              )}
              {onCannotApply && (
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tasks.map(task => {
              const isSelected = selectedTaskId === task.id;
              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`group cursor-pointer transition-all duration-200 ${isSelected
                      ? 'bg-blue-50/50'
                      : 'hover:bg-slate-50'
                    }`}
                >
                  <td className="px-8 py-6">
                    {task.delegatedJobId ? (
                      <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold font-mono border border-blue-100">
                        {task.delegatedJobId}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {task.jobTitle}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 mt-0.5">{task.company}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-900">{task.clientName}</div>
                    <div className="text-xs font-medium text-slate-400 break-all">{task.clientEmail}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-900">
                      {new Date(task.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    {getAIStatusBadge(task.aiStatus)}
                  </td>
                  {showProofColumn && (
                    <td className="px-8 py-6">
                      {task.proofOfWork?.screenshotUrl ? (
                        <a
                          href={`/api/resume/view?path=${encodeURIComponent(task.proofOfWork.screenshotUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  )}
                  {showCannotApplyReason && (
                    <td className="px-8 py-6">
                      <span className="text-xs text-slate-600 max-w-[200px] truncate block" title={task.cannotApplyReason}>
                        {task.cannotApplyReason || '-'}
                      </span>
                    </td>
                  )}
                  {onCannotApply && (
                    <td className="px-8 py-6">
                      {task.status === 'Applying' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCannotApply(task);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                          title="Mark as Cannot Apply"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Can't Apply
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
