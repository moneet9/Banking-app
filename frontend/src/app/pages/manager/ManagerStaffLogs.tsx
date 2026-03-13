import { useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, Filter, Search, UserRound, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  getManagerStaffActivityLogs,
  getManagerStaffMembers,
  type StaffActivityLogItem,
  type StaffMemberItem,
} from '../../services/bankingApi';

const ACTION_FILTERS = [
  { value: '', label: 'All Actions' },
  { value: 'STAFF_PASSBOOK_VIEW', label: 'Passbook Views' },
  { value: 'STAFF_CASH_DEPOSIT', label: 'Cash Deposits' },
  { value: 'STAFF_CASH_WITHDRAWAL', label: 'Cash Withdrawals' },
  { value: 'STAFF_CASH_REQUEST_APPROVE', label: 'Request Approvals' },
  { value: 'STAFF_CASH_REQUEST_REJECT', label: 'Request Rejections' },
];

function toActionLabel(action: string) {
  return action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toMetadataLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'number') {
    return value.toLocaleString('en-IN');
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

function getActionTone(action: string) {
  if (action.includes('APPROVE') || action.includes('DEPOSIT')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (action.includes('REJECT') || action.includes('WITHDRAWAL')) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  if (action.includes('PASSBOOK')) {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function getActionAccent(action: string) {
  if (action.includes('APPROVE') || action.includes('DEPOSIT')) {
    return 'bg-emerald-500';
  }

  if (action.includes('REJECT') || action.includes('WITHDRAWAL')) {
    return 'bg-rose-500';
  }

  if (action.includes('PASSBOOK')) {
    return 'bg-sky-500';
  }

  return 'bg-slate-500';
}

export default function ManagerStaffLogs() {
  const [staffSearch, setStaffSearch] = useState('');
  const [staffMembers, setStaffMembers] = useState<StaffMemberItem[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(true);

  const [selectedStaff, setSelectedStaff] = useState<StaffMemberItem | null>(null);
  const [logSearch, setLogSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [logs, setLogs] = useState<StaffActivityLogItem[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsStaffLoading(true);
        const items = await getManagerStaffMembers(staffSearch);
        setStaffMembers(items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load staff list');
      } finally {
        setIsStaffLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [staffSearch]);

  const loadLogs = async (staffId: string, query: string, action: string) => {
    try {
      setIsLogsLoading(true);
      const items = await getManagerStaffActivityLogs(query, staffId, action);
      setLogs(items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load staff activity logs');
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs(selectedStaff?.id || '', logSearch, actionFilter);
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedStaff, logSearch, actionFilter]);

  const selectedStaffLabel = useMemo(() => {
    if (!selectedStaff) {
      return 'All Staff Logs';
    }

    return `${selectedStaff.fullName} (${selectedStaff.accountNumber})`;
  }, [selectedStaff]);

  const summary = useMemo(() => {
    const actorCount = new Set(logs.map((item) => item.actor?.id).filter(Boolean)).size;
    const customerCount = new Set(logs.map((item) => item.target?.id).filter(Boolean)).size;
    const actionCount = new Set(logs.map((item) => item.action)).size;

    return {
      actorCount,
      customerCount,
      actionCount,
    };
  }, [logs]);

  const hasActiveFilters = Boolean(selectedStaff || logSearch || actionFilter);

  const activeActionLabel = useMemo(() => {
    const found = ACTION_FILTERS.find((item) => item.value === actionFilter);
    return found ? found.label : 'All Actions';
  }, [actionFilter]);

  return (
    <div className="flex h-screen bg-slate-50">
      <ManagerSidebar />

      <div className="flex-1 overflow-auto">
        <div className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 px-8 py-7">
          <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-16 h-40 w-40 rounded-full bg-teal-200/30 blur-3xl" />

          <div className="relative flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-600 p-2.5 text-white shadow-lg shadow-emerald-600/25">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Staff Activity Logs</h1>
                <p className="mt-1 text-sm text-slate-600">Track every staff action with clear audit context.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald-100 bg-white/85 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visible Logs</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{logs.length}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/85 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Staff</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{summary.actorCount}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/85 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customers Affected</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{summary.customerCount}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/85 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Action Types</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{summary.actionCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-8 xl:grid-cols-[340px_1fr]">
          <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Staff Directory</h2>
                <p className="text-xs text-slate-500">Choose staff to narrow audit logs</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-2 text-slate-500">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search staff..."
                value={staffSearch}
                onChange={(event) => setStaffSearch(event.target.value)}
                className="h-11 rounded-xl border-slate-200 pl-9"
              />
            </div>

            <button
              onClick={() => setSelectedStaff(null)}
              className={`mb-2 w-full rounded-xl border p-3 text-left transition-colors ${
                !selectedStaff
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <p className="text-sm font-semibold">All Staff Logs</p>
              <p className="text-xs text-slate-500">No staff filter</p>
            </button>

            <div className="max-h-[68vh] space-y-2 overflow-auto pr-1">
              {isStaffLoading && <p className="text-sm text-slate-500">Loading staff...</p>}
              {!isStaffLoading && staffMembers.length === 0 && (
                <p className="text-sm text-slate-500">No staff found.</p>
              )}
              {staffMembers.map((staff) => {
                const isActive = selectedStaff?.id === staff.id;

                return (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      isActive
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{staff.fullName}</p>
                    <p className="text-xs text-slate-500">{staff.accountNumber}</p>
                    <p className="text-xs text-slate-500">{staff.email}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedStaffLabel}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Focused on {activeActionLabel.toLowerCase()} with {logs.length} matched records.
                  </p>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedStaff(null);
                      setLogSearch('');
                      setActionFilter('');
                    }}
                    className="w-fit border-slate-300"
                  >
                    <X className="h-4 w-4" />
                    Reset Filters
                  </Button>
                )}
              </div>

              <div className="mt-5 space-y-3">
                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by staff, customer, action, or description..."
                    value={logSearch}
                    onChange={(event) => setLogSearch(event.target.value)}
                    className="h-11 rounded-xl border-slate-200 pl-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="mr-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Filter className="h-3.5 w-3.5" />
                    Action
                  </div>
                  {ACTION_FILTERS.map((item) => {
                    const isActive = actionFilter === item.value;

                    return (
                      <button
                        key={item.value || 'all'}
                        onClick={() => setActionFilter(item.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {isLogsLoading && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Loading activity logs...
                </div>
              )}

              {!isLogsLoading && logs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No staff activity logs found</p>
                  <p className="mt-1 text-xs text-slate-500">Try changing staff or action filters.</p>
                </div>
              )}

              {!isLogsLoading &&
                logs.map((item) => {
                  const metadataEntries = Object.entries(item.metadata || {})
                    .map(([key, value]) => [key, formatMetadataValue(value)] as const)
                    .filter(([, value]) => Boolean(value))
                    .slice(0, 4);

                  return (
                    <article
                      key={item.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className={`absolute left-0 top-0 h-full w-1 ${getActionAccent(item.action)}`} />

                      <div className="pl-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`border font-semibold ${getActionTone(item.action)}`}
                            >
                              {toActionLabel(item.action)}
                            </Badge>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              {new Date(item.createdAt).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-slate-700">{item.description}</p>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Staff</p>
                            <div className="mt-1 flex items-start gap-2">
                              <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.actor?.fullName || 'Unknown staff'}
                                </p>
                                <p className="text-xs text-slate-500">{item.actor?.email || 'No email available'}</p>
                                {item.actor?.accountNumber && (
                                  <p className="text-xs text-slate-500">{item.actor.accountNumber}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Customer</p>
                            <div className="mt-1 flex items-start gap-2">
                              <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.target?.fullName || 'No customer linked'}
                                </p>
                                <p className="text-xs text-slate-500">{item.target?.email || 'No email available'}</p>
                                {item.target?.accountNumber && (
                                  <p className="text-xs text-slate-500">{item.target.accountNumber}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {metadataEntries.length > 0 && (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              <Filter className="h-3.5 w-3.5" />
                              Metadata
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {metadataEntries.map(([key, value]) => (
                                <div key={`${item.id}-${key}`} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                                  <p className="text-[11px] font-semibold text-slate-500">{toMetadataLabel(key)}</p>
                                  <p className="text-xs text-slate-700">{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
