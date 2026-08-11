import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/core/components/Breadcrumb'

import { candidateApplicationApi } from '../../infrastructure/candidateApplicationApi'
import { candidateCompanies, candidateCompanyJobs } from '../../domain/candidateData'
import { truncateCandidateText } from '../../application/candidateText'
import { useCandidateJobDetail } from '../../application/useCandidateCompanies'
import { markResumeUploaded, readCandidateIdFromPayload, saveResumeCandidateId } from '../../application/candidateResumeSession'

const allowedCvExtensions = ['pdf', 'doc', 'docx']
const maxCvFileSize = 5 * 1024 * 1024

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

function getFileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || ''
}

export function CandidateCvUploadPage() {
  const navigate = useNavigate()
  const { companyId, jobId } = useParams<{ companyId?: string; jobId?: string }>()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploaded, setIsUploaded] = useState(false)
  const jobQuery = useCandidateJobDetail(jobId)
  const job = jobQuery.data || candidateCompanyJobs.find((item) => item.id === jobId)
  const displayJobTitle = job?.title || 'Job Detail'

  if (!companyId || !jobId) return <Navigate to="/candidate/companies" replace />

  const validateAndSetFile = (file?: File) => {
    if (!file) return

    const extension = getFileExtension(file)
    if (!allowedCvExtensions.includes(extension)) {
      setSelectedFile(null)
      setError('Please upload a PDF, DOC, or DOCX file.')
      return
    }

    if (file.size > maxCvFileSize) {
      setSelectedFile(null)
      setError('Maximum file size is 5MB.')
      return
    }

    setSelectedFile(file)
    setError('')
    setIsUploaded(false)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(event.target.files?.[0])
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    validateAndSetFile(event.dataTransfer.files?.[0])
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Choose your CV before uploading.')
      return
    }

    setIsUploading(true)
    setError('')
    try {
      const uploadResult = await candidateApplicationApi.uploadCvForJob(jobId, selectedFile)
      const candidateId = readCandidateIdFromPayload(uploadResult)
      if (candidateId) saveResumeCandidateId(jobId, candidateId)
      markResumeUploaded(jobId)
      setIsUploaded(true)
      navigate(`/candidate/companies/${companyId}/jobs/${jobId}/cv-score`)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="candidate-cv-upload-page">
      <Breadcrumb
        className="candidate-breadcrumb"
        items={[
          { label: 'Home', onClick: () => navigate('/candidate') },
          { label: truncateCandidateText(displayJobTitle), onClick: () => navigate(`/candidate/companies/${companyId}/jobs/${jobId}`) },
          { label: 'Upload CV' },
        ]}
      />

      <header className="candidate-cv-upload-header">
        <h1>Candidate Onboarding</h1>
        <p>Upload a resume to automatically extract professional details, skills, and experience using JobFusion AI. Our intelligence engine analyzes complex layouts to build a rich talent profile in seconds.</p>
      </header>

      <div className="candidate-cv-upload-layout">
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="candidate-cv-hidden-input"
            onChange={handleFileChange}
          />
          <div
            className={`candidate-cv-dropzone ${isDragging ? 'is-dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {!selectedFile && !isUploaded && <span><i className="fa-solid fa-cloud-arrow-up"></i></span>}
            <strong>{selectedFile ? selectedFile.name : 'Drag and drop your CV here, or click to browse'}</strong>
            <small>{selectedFile ? `${formatFileSize(selectedFile.size)} ready to upload` : 'Supported formats: PDF, DOC, DOCX. Maximum file size 5MB.'}</small>
            <button type="button" onClick={() => inputRef.current?.click()}>Browse Files</button>
            {error && <em>{error}</em>}
            {isUploaded && <em className="success">CV uploaded successfully. AI parsing has started.</em>}
          </div>

          <div className="candidate-cv-upload-actions">
            <button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload CV'}
            </button>
          </div>
        </div>

        <aside className="candidate-cv-system-panel">
          <span><i className="fa-solid fa-wand-magic-sparkles"></i> System Intelligence</span>
          <h2>Why upload?</h2>
          <ul>
            <li><i className="fa-solid fa-check"></i><div><strong>Automatically extracted</strong><small>JobFusion AI identifies details, skills, and experience.</small></div></li>
            <li><i className="fa-solid fa-check"></i><div><strong>Deep skill matching</strong><small>Instantly finds relevant strengths for this role.</small></div></li>
            <li><i className="fa-solid fa-check"></i><div><strong>Interview ready</strong><small>Generates insight your hiring team can review.</small></div></li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
