import type { ComponentProps } from 'react'
import { CreateStaffAccountView } from '../components/CreateStaffAccountView'
import { EditStaffAccountView } from '../components/EditStaffAccountView'
import { StaffActivityLogView } from '../components/StaffActivityLogView'
import { StaffDetailView } from '../components/StaffDetailView'
import { StaffManagementView } from '../components/StaffManagementView'

export type StaffManagementPageProps = ComponentProps<typeof StaffManagementView>

export function TenantAdminStaffManagement(props: StaffManagementPageProps) {
  return <StaffManagementView {...props} />
}

export {
  CreateStaffAccountView,
  EditStaffAccountView,
  StaffActivityLogView,
  StaffDetailView,
}
