import { Schedule } from './firebase'

// ICS 파일 생성을 위한 유틸리티 함수
export function generateICS(schedule: Schedule): string {
  // 날짜 포맷팅 함수 (YYYYMMDDTHHMMSSZ 형식)
  const formatDateToICS = (timestamp: any): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return ''
    }
    const date = timestamp.toDate()
    
    // UTC로 변환
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
  }

  // 현재 시간을 ICS 형식으로
  const now = new Date()
  const dtstamp = formatDateToICS({ toDate: () => now })
  
  // 시작/종료 시간
  const dtstart = formatDateToICS(schedule.startDate)
  const dtend = schedule.endDate 
    ? formatDateToICS(schedule.endDate)
    : formatDateToICS(schedule.startDate) // 종료시간이 없으면 시작시간과 동일
  
  // UID 생성 (고유 식별자)
  const uid = `${schedule.id}@euo-oma-blog.firebaseapp.com`
  
  // ICS 파일 내용 생성
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EUO OMA Blog//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICSText(schedule.title)}`,
  ]
  
  // 설명 추가
  if (schedule.description) {
    icsContent.push(`DESCRIPTION:${escapeICSText(schedule.description)}`)
  }
  
  // 장소 추가
  if (schedule.location) {
    icsContent.push(`LOCATION:${escapeICSText(schedule.location)}`)
  }
  
  // 알림 추가 (30분 전)
  icsContent.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-PT30M',
    `DESCRIPTION:${escapeICSText(schedule.title)} - 30분 후 시작`,
    'END:VALARM'
  )
  
  icsContent.push(
    'END:VEVENT',
    'END:VCALENDAR'
  )
  
  return icsContent.join('\r\n')
}

// ICS 텍스트 이스케이프 함수
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

// ICS 파일 다운로드 함수
export function downloadICS(schedule: Schedule): void {
  const icsContent = generateICS(schedule)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${schedule.title.replace(/[^a-zA-Z0-9가-힣 ]/g, '')}_일정.ics`
  link.click()
  
  // 메모리 정리
  URL.revokeObjectURL(url)
}