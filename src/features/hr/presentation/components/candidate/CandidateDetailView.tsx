import { useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { hrCandidatesPath } from '../../../domain/hrRoutePaths'
import { useCandidateDetailController } from '../../../application/hooks/useCandidateDetailController'
import styles from './candidateDetail.module.css'

export function CandidateDetailView() {
  const { candidateId } = useParams<{ candidateId?: string }>()
  const navigate = useNavigate()
  const { candidate, activeTab, setActiveTab, handleMarkAsReviewed, isMarkingReviewed, isLoadingResume, isLoadingApplicationDetail, resumeError } = useCandidateDetailController(candidateId)

  const componentAnalysis = candidate?.componentAnalysis || []
  const aiJustification = candidate?.aiJustification || []
  const keySkillGaps = candidate?.keySkillGaps || []
  const extractedCv = candidate?.extractedCv || { summary: '', experience: [], education: [], skills: [] }
  const cvDownloadUrl = typeof extractedCv.cvDownloadUrl === 'string' ? extractedCv.cvDownloadUrl.trim() : ''
  const formatComponentScore = (value: number) => (
    Number.isInteger(value) ? String(value) : value.toFixed(1)
  )

  return (
    <div className={`role-content ${styles.detailContainer}`}>
      <div className={styles.topBar}>
        <div className={styles.leftNav}>
          <Breadcrumb
            items={[
              { label: 'Home' },
              { label: 'Candidates', onClick: () => navigate(hrCandidatesPath) },
              { label: 'CV Detail', current: true },
            ]}
          />
          <div className={styles.tabGroup}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'extracted' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('extracted')}
            >
              Extracted CV Data
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'scoring' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('scoring')}
            >
              Scoring Breakdown
            </button>
          </div>
        </div>

        <div>
          <button type="button" className={styles.markReviewedBtn} onClick={handleMarkAsReviewed} disabled={isMarkingReviewed || isLoadingApplicationDetail || candidate?.reviewed}>
            {isMarkingReviewed ? 'Marking...' : candidate?.reviewed ? 'Reviewed' : 'Mark as Reviewed'}
          </button>
        </div>
      </div>

      {isLoadingResume && <div className={styles.resumeStateMessage}>Loading extracted CV data...</div>}
      {resumeError && <div className={`${styles.resumeStateMessage} ${styles.resumeStateError}`}>Unable to load the latest CV detail. Showing available data.</div>}

      {activeTab === 'scoring' ? (
        <>
          <div className={styles.topRowGrid}>
            <div className={styles.profileCard}>
              <div className={styles.avatarWrap}>
                {candidate?.avatarUrl ? (
                  <img src={candidate.avatarUrl} alt={candidate.name} className={styles.avatarImage} />
                ) : (
                  <i className="fa-solid fa-user"></i>
                )}
              </div>
              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>{candidate?.name}</h2>
                <div className={styles.profileRole}>{candidate?.targetJob}</div>
                <div className={styles.contactRow}>
                  <span className={styles.contactItem}>
                    <i className="fa-regular fa-envelope"></i>
                    <span className={styles.contactText} title={candidate?.email}>{candidate?.email}</span>
                  </span>
                  <span className={styles.contactItem}>
                    <i className="fa-solid fa-phone"></i>
                    <span className={styles.contactText} title={candidate?.phone}>{candidate?.phone}</span>
                  </span>
                  <span className={styles.contactItem}>
                    <i className="fa-solid fa-location-dot"></i>
                    <span className={styles.contactText} title={candidate?.location}>{candidate?.location}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.scoreCard}>
              <div className={styles.scoreRingWrap}>
                <svg className={styles.scoreRingSvg} viewBox="0 0 80 80">
                  <circle className={styles.scoreRingBg} cx="40" cy="40" r="32" fill="none" />
                  <circle
                    className={styles.scoreRingFill}
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    style={{ strokeDashoffset: 200 - ((candidate?.matchScore || 0) / 100) * 200 }}
                  />
                </svg>
                <span className={styles.scoreRingText}>{candidate?.matchScore || 0}%</span>
              </div>
              <span className={styles.scoreStatusText}>
                {candidate?.scoringStatus === 'COMPLETED' ? 'Overall Match' : 'Scoring In Progress'}
              </span>
            </div>
          </div>

          <div className={styles.bottomGrid}>
            <div className={styles.panelBox}>
              <h3 className={styles.panelTitle}>Component Analysis</h3>
              <div className={styles.componentList}>
                {componentAnalysis.map((comp, index) => {
                  const score = Number(comp.score) || 0
                  const weight = Number(comp.weight) || 0
                  const barWidth = weight > 0 ? Math.max(0, Math.min(100, (score / weight) * 100)) : 0

                  return (
                    <div key={`${comp.category || comp.analysis || 'component'}-${index}`} className={styles.componentItem}>
                      <div className={styles.componentHead}>
                        <span>{comp.category || 'Component'}</span>
                        <span>{weight > 0 ? `${formatComponentScore(score)} / ${formatComponentScore(weight)}` : formatComponentScore(score)}</span>
                      </div>
                      <div className={styles.componentBarBg}>
                        <div className={styles.componentBarFill} style={{ width: `${barWidth}%` }} />
                      </div>
                      <div className={styles.componentDesc}>{comp.analysis}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={styles.rightStack}>
              <div className={styles.panelBox}>
                <h3 className={styles.panelTitle}>
                  <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#d97706' }}></i>
                  AI Justification
                </h3>
                <ul className={styles.insightList}>
                  {aiJustification.map((item, index) => (
                    <li key={index} className={styles.insightItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.panelBox}>
                <h3 className={styles.panelTitle}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ef4444' }}></i>
                  Key Skill Gaps
                </h3>
                <ul className={styles.gapList}>
                  {keySkillGaps.map((item, index) => (
                    <li key={index} className={styles.gapItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.extractedLayoutGrid}>
          {/* Left Column (65% width) */}
          <div className={styles.extractedLeftStack}>
            {/* Top Profile Card */}
            <div className={styles.profileCard}>
              <div className={styles.avatarWrap}>
                {candidate?.avatarUrl ? (
                  <img src={candidate.avatarUrl} alt={candidate.name} className={styles.avatarImage} />
                ) : (
                  <i className="fa-solid fa-user"></i>
                )}
              </div>
              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>{candidate?.name}</h2>
                <div className={styles.profileRole}>{candidate?.targetJob}</div>
                <div className={styles.contactRow}>
                <span className={styles.contactItem}>
                  <i className="fa-regular fa-envelope"></i>
                  <span className={styles.contactText} title={candidate?.email}>{candidate?.email}</span>
                </span>
                <span className={styles.contactItem}>
                  <i className="fa-solid fa-phone"></i>
                  <span className={styles.contactText} title={candidate?.phone}>{candidate?.phone}</span>
                </span>
                <span className={styles.contactItem}>
                  <i className="fa-solid fa-location-dot"></i>
                  <span className={styles.contactText} title={candidate?.location}>{candidate?.location}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Work Experience Card */}
            <div className={styles.panelBox}>
              <h3 className={styles.panelTitle}>
                <div className={styles.titleIconBadge}>
                  <i className="fa-solid fa-briefcase"></i>
                </div>
                Work Experience
              </h3>
              <div className={styles.experienceList}>
                {(extractedCv.experience || []).map((exp, idx) => (
                  <div key={idx} className={styles.experienceItem}>
                    <div className={styles.expHeader}>
                      <div className={styles.expHeaderLeft}>
                        <div className={styles.expIconCircle}>
                          <i className="fa-solid fa-building"></i>
                        </div>
                        <div>
                          <h4 className={styles.expTitle}>{exp.title}</h4>
                          <span className={styles.expCompany}>{exp.company}</span>
                        </div>
                      </div>
                      <span className={styles.expDuration}>{exp.duration}</span>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 ? (
                      <div className={styles.expBulletsGrid}>
                        {exp.bullets.map((b, bIdx) => (
                          <div key={bIdx} className={styles.bulletItem}>
                            <span className={styles.bulletDot}>•</span>
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.componentDesc}>{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Education & Certifications Row */}
            <div className={styles.eduCertRowGrid}>
              {/* Education Card */}
              <div className={styles.panelBox}>
                <h3 className={styles.panelTitle}>
                  <div className={styles.titleIconBadge}>
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                  Education
                </h3>
                <div className={styles.eduList}>
                  {(extractedCv.education || []).map((edu, idx) => (
                    <div key={idx} className={styles.eduItem}>
                      <div className={styles.eduIconCircle}>
                        <i className="fa-solid fa-university"></i>
                      </div>
                      <div>
                        <h4 className={styles.eduDegree}>{edu.degree}</h4>
                        <div className={styles.eduInstYear}>{edu.institution} • {edu.year}</div>
                        {edu.description && <div className={styles.eduDesc}>{edu.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications Card */}
              <div className={styles.panelBox}>
                <h3 className={styles.panelTitle}>
                  <div className={styles.titleIconBadge}>
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  Certifications
                </h3>
                <div className={styles.certList}>
                  {(extractedCv.certifications || []).map((cert, idx) => (
                    <div key={idx} className={styles.certItem}>
                      <div className={styles.certIconCircle}>
                        <i className="fa-solid fa-award"></i>
                      </div>
                      <div>
                        <h4 className={styles.certTitle}>{cert.title}</h4>
                        <div className={styles.certExp}>EXP: {cert.exp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Inventory Card */}
            <div className={styles.panelBox}>
              <h3 className={styles.panelTitle}>
                <div className={styles.titleIconBadge}>
                  <i className="fa-solid fa-code"></i>
                </div>
                Skills Inventory
              </h3>
              <div className={styles.skillsList}>
                {(extractedCv.skills || []).map((skill) => (
                  <span key={skill} className={styles.skillPillTag}>
                    <span className={styles.skillDot}>•</span>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (35% width) - Original CV Document Card */}
          <div className={styles.pdfPreviewCard}>
            <div className={styles.pdfPreviewHeader}>
              <div className={styles.pdfFileNameWrap}>
                <i className="fa-regular fa-file-pdf"></i>
                <span>{extractedCv.cvFileName || ''}</span>
              </div>
              {cvDownloadUrl && (
                <a href={cvDownloadUrl} className={styles.pdfDownloadBtn} download>
                  <i className="fa-solid fa-download"></i>
                  Download CV
                </a>
              )}
            </div>

            <div className={styles.pdfPreviewBody}>
              {cvDownloadUrl ? (
                <iframe className={styles.pdfFrame} src={cvDownloadUrl} title="Candidate CV" />
              ) : (
                <div className={styles.resumeStateMessage}>Original CV file is not available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
