import axiosClient from '@/core/api/axiosClient'

function buildFileFormData(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

export const candidateApplicationApi = {
  async uploadCvForJob(jobId: string, file: File) {
    const response = await axiosClient.post(
      `/api/candidate/resume/job/${encodeURIComponent(jobId)}`,
      buildFileFormData(file),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data
  },

  async getResumeByJobAndCandidate(jobId: string, candidateId: string) {
    const response = await axiosClient.get(
      `/api/candidate/resume/job/${encodeURIComponent(jobId)}/candidate/${encodeURIComponent(candidateId)}`,
    )
    return response.data
  },
}
