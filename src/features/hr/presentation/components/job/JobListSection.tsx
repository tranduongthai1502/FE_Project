import { Breadcrumb } from '@/core/components/Breadcrumb'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { EditIcon } from '@/core/components/Icons'
import { ListTable } from '@/core/components/ListTable'
import { SearchInput } from '@/core/components/SearchInput'
import { formatEmploymentType, formatJobDate, formatJobStatus, getJobActionConfirmMessage, isClosedJobStatus, isDraftJobStatus, isOpenJobStatus } from '@/features/hr/infrastructure/hrJobLogic'
import styles from '@/features/hr/presentation/pages/HrDashboard.module.css'

export function CloseJobIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12.5001 0C13.8814 0 15.2062 0.548733 16.1829 1.52549C17.1597 2.50224 17.7084 3.827 17.7084 5.20833V8.46875C18.6023 8.69955 19.3942 9.22068 19.9598 9.95033C20.5255 10.68 20.8327 11.5768 20.8334 12.5V18.75C20.8334 19.8551 20.3944 20.9149 19.613 21.6963C18.8316 22.4777 17.7718 22.9167 16.6667 22.9167H8.33342C7.22835 22.9167 6.16854 22.4777 5.38714 21.6963C4.60573 20.9149 4.16675 19.8551 4.16675 18.75V12.5C4.16744 11.5768 4.47471 10.68 5.04033 9.95033C5.60594 9.22068 6.39786 8.69955 7.29175 8.46875V5.20833C7.29175 3.827 7.84048 2.50224 8.81723 1.52549C9.79399 0.548733 11.1187 0 12.5001 0ZM8.33342 10.4167C7.78088 10.4167 7.25098 10.6362 6.86028 11.0269C6.46957 11.4176 6.25008 11.9475 6.25008 12.5V18.75C6.25008 19.3025 6.46957 19.8324 6.86028 20.2231C7.25098 20.6138 7.78088 20.8333 8.33342 20.8333H16.6667C17.2193 20.8333 17.7492 20.6138 18.1399 20.2231C18.5306 19.8324 18.7501 19.3025 18.7501 18.75V12.5C18.7501 11.9475 18.5306 11.4176 18.1399 11.0269C17.7492 10.6362 17.2193 10.4167 16.6667 10.4167H8.33342ZM12.5001 14.0625C12.9145 14.0625 13.3119 14.2271 13.6049 14.5201C13.898 14.8132 14.0626 15.2106 14.0626 15.625C14.0626 16.0394 13.898 16.4368 13.6049 16.7299C13.3119 17.0229 12.9145 17.1875 12.5001 17.1875C12.0857 17.1875 11.6883 17.0229 11.3952 16.7299C11.1022 16.4368 10.9376 16.0394 10.9376 15.625C10.9376 15.2106 11.1022 14.8132 11.3952 14.5201C11.6883 14.2271 12.0857 14.0625 12.5001 14.0625ZM12.5001 2.08333C11.6713 2.08333 10.8764 2.41257 10.2904 2.99862C9.70432 3.58468 9.37508 4.37953 9.37508 5.20833V8.33333H15.6251V5.20833C15.6251 4.37953 15.2958 3.58468 14.7098 2.99862C14.1237 2.41257 13.3289 2.08333 12.5001 2.08333Z" fill="currentColor" />
    </svg>
  )
}

export function OpenJobIcon() {
  return (
    <svg width="16" height="21" viewBox="0 0 16 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1 12C1 11.4696 1.21071 10.9609 1.58579 10.5858C1.96086 10.2107 2.46957 10 3 10H13C13.5304 10 14.0391 10.2107 14.4142 10.5858C14.7893 10.9609 15 11.4696 15 12V18C15 18.5304 14.7893 19.0391 14.4142 19.4142C14.0391 19.7893 13.5304 20 13 20H3C2.46957 20 1.96086 19.7893 1.58579 19.4142C1.21071 19.0391 1 18.5304 1 18V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10V5C4 3.93913 4.42143 2.92172 5.17157 2.17157C5.92172 1.42143 6.93913 1 8 1C9.06087 1 10.0783 1.42143 10.8284 2.17157C11.5786 2.92172 12 3.93913 12 5M7 15C7 15.2652 7.10536 15.5196 7.29289 15.7071C7.48043 15.8946 7.73478 16 8 16C8.26522 16 8.51957 15.8946 8.70711 15.7071C8.89464 15.5196 9 15.2652 9 15C9 14.7348 8.89464 14.4804 8.70711 14.2929C8.51957 14.1054 8.26522 14 8 14C7.73478 14 7.48043 14.1054 7.29289 14.2929C7.10536 14.4804 7 14.7348 7 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function JobsEmptyLargeIcon() {
  return (
    <svg width="131" height="132" viewBox="0 0 131 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clipPath="url(#jobs-empty-large-clip)">
        <path d="M57.3125 111.375C49.0347 111.378 40.8499 109.616 33.2959 106.205C33.0936 106.099 32.8689 106.043 32.6409 106.043C32.4128 106.043 32.1882 106.099 31.9859 106.205C31.7988 106.332 31.646 106.505 31.5412 106.706C31.4364 106.908 31.3829 107.132 31.3855 107.36V118.36C31.3855 119.089 31.673 119.789 32.1848 120.304C32.6966 120.82 33.3908 121.11 34.1146 121.11H40.9375C41.2995 121.11 41.6465 121.255 41.9025 121.513C42.1584 121.771 42.3021 122.12 42.3021 122.485V129.25C42.3021 129.979 42.5897 130.679 43.1015 131.194C43.6133 131.71 44.3075 132 45.0313 132H72.323C73.0468 132 73.741 131.71 74.2528 131.194C74.7646 130.679 75.0521 129.979 75.0521 129.25V122.375C75.0521 122.01 75.1959 121.66 75.4518 121.403C75.7077 121.145 76.0548 121 76.4167 121H83.2396C83.9635 121 84.6576 120.71 85.1694 120.194C85.6813 119.679 85.9688 118.979 85.9688 118.25V106.15C85.9709 105.916 85.9113 105.686 85.7962 105.483C85.6812 105.28 85.5147 105.112 85.3138 104.995C85.1166 104.873 84.8899 104.809 84.6588 104.809C84.4277 104.809 84.201 104.873 84.0038 104.995C75.7356 109.227 66.5861 111.414 57.3125 111.375Z" fill="#E4BEB4" fillOpacity="0.4" />
        <path d="M121.775 104.17L99.2325 81.455C99.0177 81.213 98.8989 80.8997 98.8989 80.575C98.8989 80.2503 99.0177 79.937 99.2325 79.695C106.348 69.2215 109.326 56.4481 107.584 43.8775C105.841 31.3069 99.502 19.8451 89.8099 11.7378C80.1178 3.63054 67.7707 -0.537917 55.1876 0.0491832C42.6045 0.636284 30.6925 5.93663 21.7854 14.9117C12.8783 23.8868 7.61812 35.8898 7.03546 48.5689C6.45281 61.248 10.5897 73.6894 18.6356 83.4555C26.6814 93.2216 38.0564 99.6085 50.5318 101.365C63.0072 103.121 75.6838 100.12 86.0779 92.95C86.3181 92.7336 86.629 92.6139 86.9513 92.6139C87.2735 92.6139 87.5844 92.7336 87.8246 92.95L110.368 115.665C111.903 117.21 113.984 118.078 116.153 118.078C118.323 118.078 120.404 117.21 121.939 115.665C123.414 114.111 124.224 112.034 124.193 109.884C124.163 107.733 123.294 105.681 121.775 104.17ZM46.505 41.635C46.563 41.4249 46.6738 41.2335 46.8269 41.0793C46.9799 40.9251 47.1699 40.8134 47.3784 40.755C47.5543 40.6588 47.7513 40.6083 47.9515 40.6083C48.1517 40.6083 48.3487 40.6588 48.5246 40.755C53.2028 43.7099 58.6141 45.2732 64.1354 45.265C65.9669 45.2358 67.7928 45.0519 69.5938 44.715C69.67 44.6763 69.7541 44.6562 69.8394 44.6562C69.9247 44.6562 70.0088 44.6763 70.085 44.715C70.135 44.8574 70.135 45.0127 70.085 45.155C70.085 48.4371 68.7911 51.5847 66.4879 53.9055C64.1847 56.2262 61.061 57.53 57.8038 57.53C54.5466 57.53 51.4228 56.2262 49.1196 53.9055C46.8164 51.5847 45.5225 48.4371 45.5225 45.155C45.6712 43.9383 46.0024 42.7514 46.505 41.635ZM17.7396 50.93C17.7366 44.3161 19.3642 37.8051 22.476 31.9817C25.5878 26.1583 30.0864 21.2049 35.5678 17.5666C41.0492 13.9283 47.3417 11.7189 53.8801 11.1369C60.4184 10.5549 66.9978 11.6185 73.0273 14.2322C79.0568 16.846 84.3476 20.9279 88.4244 26.1114C92.5012 31.295 95.2363 37.4177 96.384 43.9297C97.5318 50.4417 97.0563 57.139 95.0002 63.42C92.9441 69.7011 89.3718 75.3691 84.6042 79.915C84.4803 80.0477 84.3257 80.1473 84.1542 80.2049C83.9828 80.2625 83.7998 80.2763 83.6217 80.245C83.4458 80.2208 83.277 80.1592 83.1265 80.0644C82.9759 79.9696 82.8471 79.8437 82.7483 79.695C79.5564 74.6489 74.9362 70.6832 69.4846 68.31C69.2539 68.1974 69.0593 68.0216 68.9232 67.8028C68.787 67.5839 68.7148 67.3308 68.7148 67.0725C68.7148 66.8142 68.787 66.5611 68.9232 66.3423C69.0593 66.1234 69.2539 65.9476 69.4846 65.835C73.9884 63.3443 77.5417 59.4144 79.5846 54.6645C81.6275 49.9146 82.0438 44.6147 80.7679 39.6002C79.492 34.5856 76.5965 30.1413 72.5376 26.9677C68.4787 23.7941 63.4871 22.0716 58.3496 22.0716C53.2121 22.0716 48.2205 23.7941 44.1616 26.9677C40.1027 30.1413 37.2072 34.5856 35.9313 39.6002C34.6554 44.6147 35.0717 49.9146 37.1146 54.6645C39.1575 59.4144 42.7108 63.3443 47.2146 65.835C47.4427 65.9528 47.6316 66.1354 47.7577 66.3603C47.8838 66.5852 47.9417 66.8423 47.9242 67.1C47.9101 67.3652 47.8201 67.6205 47.6651 67.8352C47.5102 68.0499 47.2968 68.2148 47.0508 68.31C41.1757 70.5076 36.3152 74.8175 33.405 80.41C33.3194 80.5961 33.1903 80.7583 32.0848 80.8829C32.867 81.0075 32.6777 81.0906 32.4771 81.125C32.2902 81.2173 32.0848 81.2653 31.8767 81.2653C31.6686 81.2653 31.4632 81.2173 31.2763 81.125C27.0065 77.3616 23.5885 72.7183 21.2531 67.5091C18.9178 62.2998 17.7196 56.6461 17.7396 50.93Z" fill="#E4BEB4" fillOpacity="0.4" />
      </g>
      <defs>
        <clipPath id="jobs-empty-large-clip">
          <rect width="131" height="132" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function JobsEmptySmallIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clipPath="url(#jobs-empty-small-clip)">
        <path d="M11.007 21H9.605C6.02 21 4.228 21 3.114 19.865C2 18.73 2 16.903 2 13.25C2 9.597 2 7.77 3.114 6.635C4.228 5.5 6.02 5.5 9.605 5.5H13.408C16.993 5.5 18.786 5.5 19.9 6.635C20.757 7.508 20.954 8.791 21 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 5.5L17.9 5.19C17.405 3.65 17.158 2.88 16.569 2.44C15.979 2 15.197 2 13.63 2H13.367C11.802 2 11.019 2 10.43 2.44C9.84 2.88 9.593 3.65 9.098 5.19L9 5.5M19.111 13.255C19.296 13.085 19.388 13 19.5 13C19.612 13 19.704 13.085 19.889 13.255L20.602 13.912C20.688 13.991 20.731 14.031 20.784 14.05C20.838 14.07 20.896 14.068 21.014 14.063L21.976 14.025C22.224 14.015 22.348 14.011 22.433 14.082C22.518 14.153 22.535 14.276 22.568 14.522L22.7 15.508C22.716 15.622 22.723 15.678 22.751 15.728C22.779 15.776 22.824 15.811 22.914 15.882L23.69 16.492C23.882 16.644 23.978 16.719 23.997 16.827C24.016 16.935 23.951 17.039 23.823 17.247L23.297 18.094C23.237 18.191 23.207 18.24 23.197 18.294C23.187 18.348 23.199 18.405 23.223 18.517L23.432 19.495C23.482 19.735 23.508 19.855 23.453 19.951C23.398 20.047 23.281 20.085 23.048 20.161L22.122 20.462C22.012 20.498 21.956 20.516 21.913 20.552C21.87 20.589 21.843 20.641 21.79 20.744L21.338 21.615C21.223 21.838 21.165 21.949 21.06 21.987C20.955 22.025 20.84 21.977 20.608 21.881L19.72 21.513C19.611 21.468 19.557 21.445 19.5 21.445C19.443 21.445 19.389 21.468 19.28 21.513L18.392 21.881C18.16 21.977 18.045 22.025 17.94 21.987C17.835 21.949 17.777 21.837 17.662 21.615L17.21 20.744C17.156 20.641 17.13 20.589 17.087 20.553C17.044 20.517 16.988 20.498 16.878 20.463L15.952 20.161C15.719 20.085 15.602 20.047 15.547 19.951C15.492 19.855 15.517 19.736 15.568 19.495L15.778 18.517C15.801 18.405 15.813 18.349 15.803 18.295C15.7825 18.2227 15.7486 18.1548 15.703 18.095L15.178 17.247C15.048 17.039 14.984 16.935 15.003 16.827C15.022 16.719 15.118 16.644 15.31 16.493L16.086 15.883C16.176 15.811 16.221 15.776 16.249 15.727C16.277 15.678 16.284 15.622 16.299 15.507L16.432 14.522C16.465 14.277 16.482 14.153 16.567 14.082C16.652 14.011 16.776 14.015 17.024 14.025L17.987 14.063C18.104 14.068 18.162 14.07 18.216 14.05C18.269 14.03 18.312 13.991 18.398 13.912L19.111 13.255Z" stroke="white" strokeWidth="1.5" />
      </g>
      <defs>
        <clipPath id="jobs-empty-small-clip">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export function JobsEmptyState() {
  return (
    <section className={styles.jobsEmptyState}>
      <div className={styles.jobsEmptyIcon}>
        <JobsEmptyLargeIcon />
        <span><JobsEmptySmallIcon /></span>
      </div>
      <p className={styles.jobsEmptyTitle}>No job postings found</p>
      <p>Click 'Create New Job Posting' to get started.</p>
    </section>
  )
}

export function JobListSection({
  isActionLocked,
  onHome,
  jobsCtrl,
}: {
  isActionLocked: boolean
  onHome: () => void
  jobsCtrl: any
}) {
  return (
    <div className={`role-content ${styles.jobsContent}`}>
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Jobs' }]} />

      <div className={styles.jobsHeader}>
        <h1>Job Postings</h1>
        <div className={styles.jobPostingHeaderActions}>
          <button type="button" disabled={isActionLocked} onClick={jobsCtrl.openCreateJob}>Create New Job Posting</button>
        </div>
      </div>

      <div className={styles.jobsMetrics}>
        <section>
          <small>Total Active Postings</small>
          <strong>{jobsCtrl.isLoadingJobs ? '...' : jobsCtrl.activeJobCount}</strong>
          <span>
            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM8 4H12V2H8V4Z" fill="#AD2B00" />
            </svg>
          </span>
        </section>
        <section>
          <small>Total Applicants</small>
          <strong>{jobsCtrl.isLoadingJobs ? '...' : jobsCtrl.totalApplicantCount.toLocaleString()}</strong>
          <span>
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M0 12V10.425C0 9.70833 0.366667 9.125 1.1 8.675C1.83333 8.225 2.8 8 4 8C4.21667 8 4.425 8.00417 4.625 8.0125C4.825 8.02083 5.01667 8.04167 5.2 8.075C4.96667 8.425 4.79167 8.79167 4.675 9.175C4.55833 9.55833 4.5 9.95833 4.5 10.375V12H0ZM6 12V10.375C6 9.84167 6.14583 9.35417 6.4375 8.9125C6.72917 8.47083 7.14167 8.08333 7.675 7.75C8.20833 7.41667 8.84583 7.16667 9.5875 7C10.3292 6.83333 11.1333 6.75 12 6.75C12.8833 6.75 13.6958 6.83333 14.4375 7C15.1792 7.16667 15.8167 7.41667 16.35 7.75C16.8833 8.08333 17.2917 8.47083 17.575 8.9125C17.8583 9.35417 18 9.84167 18 10.375V12H6ZM19.5 12V10.375C19.5 9.94167 19.4458 9.53333 19.3375 9.15C19.2292 8.76667 19.0667 8.40833 18.85 8.075C19.0333 8.04167 19.2208 8.02083 19.4125 8.0125C19.6042 8.00417 19.8 8 20 8C21.2 8 22.1667 8.22083 22.9 8.6625C23.6333 9.10417 24 9.69167 24 10.425V12H19.5ZM4 7C3.45 7 2.97917 6.80417 2.5875 6.4125C2.19583 6.02083 2 5.55 2 5C2 4.43333 2.19583 3.95833 2.5875 3.575C2.97917 3.19167 3.45 3 4 3C4.56667 3 5.04167 3.19167 5.425 3.575C5.80833 3.95833 6 4.43333 6 5C6 5.55 5.80833 6.02083 5.425 6.4125C5.04167 6.80417 4.56667 7 4 7ZM20 7C19.45 7 18.9792 6.80417 18.5875 6.4125C18.1958 6.02083 18 5.55 18 5C18 4.43333 18.1958 3.95833 18.5875 3.575C18.9792 3.19167 19.45 3 20 3C20.5667 3 21.0417 3.19167 21.425 3.575C21.8083 3.95833 22 4.43333 22 5C22 5.55 21.8083 6.02083 21.425 6.4125C21.0417 6.80417 20.5667 7 20 7ZM12 6C11.1667 6 10.4583 5.70833 9.875 5.125C9.29167 4.54167 9 3.83333 9 3C9 2.15 9.29167 1.4375 9.875 0.8625C10.4583 0.2875 11.1667 0 12 0C12.85 0 13.5625 0.2875 14.1375 0.8625C14.7125 1.4375 15 2.15 15 3C15 3.83333 14.7125 4.54167 14.1375 5.125C13.5625 5.70833 12.85 6 12 6Z" fill="#A73921" />
            </svg>
          </span>
        </section>
        <section>
          <small>POSTINGS EXPIRING SOON</small>
          <strong>{jobsCtrl.isLoadingJobs ? '...' : jobsCtrl.expiringSoonCount}</strong>
          <span>
            <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5.95 2V0H11.95V2H5.95ZM6.95 13.75L5.85 11.55C5.76667 11.3667 5.64167 11.2292 5.475 11.1375C5.30833 11.0458 5.13333 11 4.95 11H0C0.25 8.75 1.225 6.85417 2.925 5.3125C4.625 3.77083 6.63333 3 8.95 3C9.98333 3 10.975 3.16667 11.925 3.5C12.875 3.83333 13.7667 4.31667 14.6 4.95L16 3.55L17.4 4.95L16 6.35C16.5333 7.05 16.9583 7.7875 17.275 8.5625C17.5917 9.3375 17.8 10.15 17.9 11H13.575L11.85 7.55C11.6667 7.16667 11.3667 6.975 10.95 6.975C10.5333 6.975 10.2333 7.16667 10.05 7.55L6.95 13.75ZM8.95 21C6.63333 21 4.625 20.2292 2.925 18.6875C1.225 17.1458 0.25 15.25 0 13H4.325L6.05 16.45C6.23333 16.8333 6.53333 17.025 6.95 17.025C7.36667 17.025 7.66667 16.8333 7.85 16.45L10.95 10.25L12.05 12.45C12.1333 12.6333 12.2583 12.7708 12.425 12.8625C12.5917 12.9542 12.7667 13 12.95 13H17.9C17.65 15.25 16.675 17.1458 14.975 18.6875C13.275 20.2292 11.2667 21 8.95 21Z" fill="#545C72" />
            </svg>
          </span>
        </section>
      </div>

      <div className={styles.jobsToolbar}>
        <SearchInput
          className={styles.jobsSearch}
          value={jobsCtrl.searchQuery}
          onChange={(event) => jobsCtrl.updateJobSearchQuery(event.target.value)}
          placeholder="Search job title..."
          ariaLabel="Job posting search"
        />
        <label>
          <span>Status:</span>
          <select value={jobsCtrl.statusFilter} onChange={(event) => jobsCtrl.updateJobStatusFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <label>
          <span>Employment type:</span>
          <select value={jobsCtrl.employmentTypeFilter} onChange={(event) => jobsCtrl.updateJobEmploymentTypeFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </label>
      </div>

      {jobsCtrl.jobListError ? (
        <JobsEmptyState />
      ) : (
        <ListTable
          cardClassName={styles.jobsTableCard}
          rowClassName={styles.jobsTableRow}
          headClassName={styles.jobsTableHead}
          stateClassName={styles.jobsTableState}
          columns={['Job Title', 'Department', 'Employment Type', 'Status', 'No. of Applicants', 'Date Created', 'Actions']}
          isLoading={jobsCtrl.isLoadingJobs}
          empty={jobsCtrl.jobs.length === 0}
          loadingMessage="Loading job postings..."
          emptyMessage="No job postings found."
          pagination={{
            label: `Showing ${jobsCtrl.jobs.length} of ${jobsCtrl.jobTotalElements} entries`,
            currentPage: jobsCtrl.safeJobPage,
            pageCount: jobsCtrl.jobPageCount,
            pageItems: jobsCtrl.jobPageItems,
            onPageChange: jobsCtrl.setJobPage,
            ellipsisKeyPrefix: 'job',
            buttonClassName: styles.paginationIconButton,
            activeButtonClassName: styles.activePage,
            ellipsisClassName: styles.paginationEllipsis,
          }}
        >
          {jobsCtrl.jobs.map((job: any) => {
            const jobIsDraft = isDraftJobStatus(job.status)
            const jobIsClosed = isClosedJobStatus(job.status)
            const jobIsOpen = isOpenJobStatus(job.status)

            return (
              <article className={styles.jobsTableRow} key={job.id} onClick={() => jobsCtrl.openJobDetail(job)}>
                <span className="table-name-tooltip" data-tooltip={job.title} title={job.title} tabIndex={0}>
                  <strong>{job.title}</strong>
                </span>
                <span title={job.department}>{job.department}</span>
                <span>{formatEmploymentType(job.employmentType)}</span>
                <em className={job.status.toLowerCase()}>{formatJobStatus(job.status)}</em>
                <span>{job.applicantCount}</span>
                <span>{formatJobDate(job.createdAt)}</span>
                <div className={styles.jobsActions}>
                  <button type="button" className="icon-tooltip" data-tooltip="Edit" aria-label={`Edit ${job.title}`} disabled={isActionLocked} onClick={(event) => { event.stopPropagation(); jobsCtrl.openEditJob(job) }}><EditIcon /></button>
                  {(jobIsDraft || jobIsClosed) && (
                    <button type="button" className="icon-tooltip" data-tooltip="Open" aria-label={`Open ${job.title}`} disabled={isActionLocked} onClick={(event) => { event.stopPropagation(); jobsCtrl.requestJobAction('open', job) }}><OpenJobIcon /></button>
                  )}
                  {jobIsOpen && (
                    <button type="button" className="icon-tooltip" data-tooltip="Close" aria-label={`Close ${job.title}`} disabled={isActionLocked} onClick={(event) => { event.stopPropagation(); jobsCtrl.requestJobAction('close', job) }}><CloseJobIcon /></button>
                  )}
                </div>
              </article>
            )
          })}
        </ListTable>
      )}
      {jobsCtrl.jobConfirmAction && jobsCtrl.jobConfirmTarget && (
        <ConfirmActionModal
          isSubmitting={jobsCtrl.isJobActionSubmitting}
          title="Confirm Action"
          message={getJobActionConfirmMessage(jobsCtrl.jobConfirmAction, jobsCtrl.jobConfirmTarget)}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={jobsCtrl.closeJobConfirm}
          onConfirm={jobsCtrl.confirmJobAction}
        />
      )}
    </div>
  )
}
