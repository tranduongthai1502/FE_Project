import { AccountSettingsPanel } from '@/features/auth'
import { DashboardShell } from '@/core/components/DashboardShell'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { buildNavigation } from '@/core/hooks/navigation'
import {
  CreateStaffAccountView,
  EditStaffAccountView,
  StaffActivityLogView,
  StaffDetailView,
  TenantAdminStaffManagement,
} from './TenantAdminStaffManagement'
import { tenantNav } from '../components/tenantNavigation'
import { tenantAdminSessionStorage } from '../../infrastructure/tenantAdminSessionStorage'
import { tenantFileDownloader } from '../../infrastructure/tenantFileDownloader'
import { tenantAdminRepository } from '../../infrastructure/tenantAdminRepository'
import { tenantStaffSelectionStorage } from '../../infrastructure/tenantStaffSelectionStorage'
import { TenantAdminHome } from './TenantAdminHome'
import { useTenantAdminDashboardController } from '../../application/useTenantAdminDashboardController'

export function TenantAdminDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const {
    activeView,
    activityEndDateFilter,
    activityError,
    activityEventTypeFilter,
    activityLogPage,
    activityLogPageCount,
    activityLogs,
    activityStartDateFilter,
    changeView,
    deleteConfirmStaff,
    detailRouteStaffId,
    guardTenantActive,
    handleClearActivityLogs,
    handleCreateStaffSubmit,
    handleDeleteStaffConfirm,
    handleExportActivityLogs,
    handleToggleStatus,
    handleUpdateStaffSubmit,
    isActionLocked,
    isClearingActivityLogs,
    isDeleting,
    isExportingActivityLogs,
    isLoadingActivities,
    isLoadingStaff,
    isLoadingStaffDetail,
    isLoadingTenantDetail,
    isPasswordChangeRequired,
    isSaving,
    isStaffQuotaUnlimited,
    loadStaffDetail,
    handleSidebarViewChange,
    maxStaffQuota,
    recentActivities,
    selectedStaff,
    selectedStaffMatchesDetailRoute,
    setActivityStartDateFilter,
    setActivityEndDateFilter,
    setActivityEventTypeFilter,
    setActivityLogPage,
    setDeleteConfirmStaff,
    setSelectedStaff,
    setStaffFormFieldErrors,
    setStaffPage,
    setStaffRoleFilter,
    setStaffSearchQuery,
    setStaffStatusFilter,
    setStatusConfirmStaff,
    staffAccountCount,
    staffAccountList,
    staffError,
    staffFormFieldErrors,
    staffList,
    staffPage,
    staffPageCount,
    staffQuotaDescription,
    staffQuotaPercent,
    staffQuotaRingLabel,
    staffQuotaSummary,
    staffRoleFilter,
    staffSearchQuery,
    staffStatusFilter,
    staffDetailError,
    statusConfirmStaff,
    user,
    viewResetKeys,
  } = useTenantAdminDashboardController({
    fileDownloader: tenantFileDownloader,
    repository: tenantAdminRepository,
    session: tenantAdminSessionStorage,
    staffSelectionStore: tenantStaffSelectionStorage,
    triggerToast,
  })
  const navItems = buildNavigation(tenantNav, activeView, handleSidebarViewChange)

  return (
    <DashboardShell navItems={navItems} subtitle="Tenant Admin" user={user} onLogout={onLogout} onChangePassword={() => changeView('settings')}>
      {activeView === 'settings' ? (
        <AccountSettingsPanel
          key={viewResetKeys.settings}
          isPasswordChangeRequired={isPasswordChangeRequired}
          onBack={() => changeView('dashboard')}
          triggerToast={triggerToast}
        />
      ) : activeView === 'staffCreate' ? (
        <CreateStaffAccountView
          key={viewResetKeys.staffCreate}
          staffList={staffAccountList}
          serverFieldErrors={staffFormFieldErrors}
          onHome={() => changeView('dashboard')}
          onCancel={() => changeView('staffManagement')}
          onConfirm={handleCreateStaffSubmit}
          isSubmitting={isSaving}
          isActionLocked={isActionLocked}
        />
      ) : activeView === 'staffEdit' ? (
        selectedStaff ? (
          <EditStaffAccountView
            key={`${selectedStaff.id}-${viewResetKeys.staffEdit}`}
            staffMember={selectedStaff}
            staffList={staffAccountList}
            serverFieldErrors={staffFormFieldErrors}
            onHome={() => changeView('dashboard')}
            onStaffManagement={() => changeView('staffManagement')}
            onConfirm={handleUpdateStaffSubmit}
            isSubmitting={isSaving}
            isActionLocked={isActionLocked}
          />
        ) : (
          <div className="role-content staff-management-content">
            <div className="tenant-list-table-state">Select a staff account before editing.</div>
          </div>
        )
      ) : (activeView === 'staffDetail' || activeView === 'staffActivityLog') && (isLoadingStaffDetail || (detailRouteStaffId && !selectedStaffMatchesDetailRoute && !staffDetailError)) ? (
        <div className="role-content staff-management-content">
          <div className="tenant-list-table-state">Loading staff details...</div>
        </div>
      ) : activeView === 'staffDetail' && staffDetailError ? (
        <div className="role-content staff-management-content">
          <div className="tenant-list-table-state error">{staffDetailError}</div>
          <button type="button" className="tenant-create-btn" onClick={() => changeView('staffManagement')}>
            Back to Staff Management
          </button>
        </div>
      ) : activeView === 'staffDetail' && selectedStaff && selectedStaffMatchesDetailRoute ? (
        <StaffDetailView
          key={`${selectedStaff.id}-${viewResetKeys.staffDetail}`}
          staffMember={selectedStaff}
          recentActivities={recentActivities}
          isLoadingActivities={isLoadingActivities}
          activityError={activityError}
          onHome={() => changeView('dashboard')}
          onBack={() => changeView('staffManagement')}
          onEdit={() => {
            if (!guardTenantActive()) return
            changeView('staffEdit', selectedStaff.id)
          }}
          onDelete={() => {
            if (!guardTenantActive()) return
            setDeleteConfirmStaff(selectedStaff)
          }}
          onToggleStatus={() => {
            if (!guardTenantActive()) return
            setStatusConfirmStaff(selectedStaff)
          }}
          onViewLogs={() => {
            setActivityLogPage(1)
            changeView('staffActivityLog', selectedStaff.id)
          }}
          isActionLocked={isActionLocked}
        />
      ) : activeView === 'staffActivityLog' && selectedStaff && selectedStaffMatchesDetailRoute ? (
        <StaffActivityLogView
          key={`${selectedStaff.id}-${viewResetKeys.staffActivityLog}`}
          staffMember={selectedStaff}
          activityLogs={activityLogs}
          isLoadingActivities={isLoadingActivities}
          activityError={activityError}
          currentPage={activityLogPage}
          pageCount={activityLogPageCount}
          eventTypeFilter={activityEventTypeFilter}
          startDateFilter={activityStartDateFilter}
          endDateFilter={activityEndDateFilter}
          isClearingActivityLogs={isClearingActivityLogs}
          isExportingActivityLogs={isExportingActivityLogs}
          onHome={() => changeView('dashboard')}
          onStaffManagement={() => changeView('staffManagement')}
          onBack={() => changeView('staffDetail', selectedStaff.id)}
          onExport={handleExportActivityLogs}
          onPageChange={setActivityLogPage}
          onEventTypeFilterChange={(value) => {
            setActivityEventTypeFilter(value)
            setActivityLogPage(1)
          }}
          onStartDateFilterChange={(value) => {
            setActivityStartDateFilter(value)
            setActivityLogPage(1)
          }}
          onEndDateFilterChange={(value) => {
            setActivityEndDateFilter(value)
            setActivityLogPage(1)
          }}
          onClearFilters={handleClearActivityLogs}
        />
      ) : (activeView === 'staffDetail' || activeView === 'staffActivityLog') ? (
        <div className="role-content staff-management-content">
          <div className="tenant-list-table-state">Select a staff account before viewing details.</div>
          <button type="button" className="tenant-create-btn" onClick={() => changeView('staffManagement')}>
            Back to Staff Management
          </button>
        </div>
      ) : activeView === 'staffManagement' ? (
        <TenantAdminStaffManagement 
          key={viewResetKeys.staffManagement}
          staffList={staffList}
          isLoading={isLoadingStaff || isLoadingTenantDetail}
          error={staffError}
          maxStaffQuota={maxStaffQuota}
          isStaffQuotaUnlimited={isStaffQuotaUnlimited}
          staffAccountCount={staffAccountCount}
          onCreate={() => {
            if (!guardTenantActive()) return
            tenantStaffSelectionStorage.clearSelectedStaff()
            setSelectedStaff(null)
            setStaffFormFieldErrors({})
            changeView('staffCreate')
          }}
          onEdit={(staff) => {
            if (!guardTenantActive()) return
            tenantStaffSelectionStorage.saveSelectedStaff(staff)
            setSelectedStaff(staff)
            setStaffFormFieldErrors({})
            changeView('staffEdit', staff.id)
          }}
          onDelete={(staff) => {
            if (!guardTenantActive()) return
            setDeleteConfirmStaff(staff)
          }}
          onSelectStaff={(staff) => {
            tenantStaffSelectionStorage.saveSelectedStaff(staff)
            setSelectedStaff(staff)
            loadStaffDetail(staff.id, staff)
            changeView('staffDetail', staff.id)
          }}
          onHome={() => changeView('dashboard')}
          currentPage={staffPage}
          pageCount={staffPageCount}
          onPageChange={setStaffPage}
          roleFilter={staffRoleFilter}
          statusFilter={staffStatusFilter}
          searchQuery={staffSearchQuery}
          onRoleFilterChange={setStaffRoleFilter}
          onStatusFilterChange={setStaffStatusFilter}
          onSearchQueryChange={setStaffSearchQuery}
          isActionLocked={isActionLocked}
        />
      ) : (
      <TenantAdminHome
        key={viewResetKeys.dashboard}
        isStaffQuotaUnlimited={isStaffQuotaUnlimited}
        staffQuotaDescription={staffQuotaDescription}
        staffQuotaPercent={staffQuotaPercent}
        staffQuotaRingLabel={staffQuotaRingLabel}
        staffQuotaSummary={staffQuotaSummary}
      />
      )}

      {deleteConfirmStaff && (
        <ConfirmActionModal
          isSubmitting={isDeleting}
          title="Confirm Action"
          message={`Are you sure you want to permanently delete ${deleteConfirmStaff.fullName}'s account? This action cannot be undone. All role assignments will be removed.`}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          submittingLabel="Confirming..."
          onCancel={() => setDeleteConfirmStaff(null)}
          onConfirm={handleDeleteStaffConfirm}
        />
      )}
      {statusConfirmStaff && (
        <ConfirmActionModal
          isSubmitting={isSaving}
          title="Confirm Action"
          message={
            statusConfirmStaff.status === 'ACTIVE'
              ? `Are you sure you want to deactivate ${statusConfirmStaff.fullName}'s account? They will lose access immediately and any active session will be terminated.`
              : `Are you sure you want to activate ${statusConfirmStaff.fullName}'s account? They will be able to log in immediately.`
          }
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          submittingLabel="Confirming..."
          onCancel={() => setStatusConfirmStaff(null)}
          onConfirm={() => handleToggleStatus(statusConfirmStaff)}
        />
      )}
    </DashboardShell>
  )
}



