import * as XLSX from 'xlsx'
import { Schedule } from './firebase'

export function exportSchedulesToExcel(schedules: Schedule[]): void {
  // 엑셀에 들어갈 데이터 준비
  const excelData = schedules.map(schedule => ({
    '제목': schedule.title,
    '설명': schedule.description,
    '시작 날짜': formatDate(schedule.startDate),
    '시작 시간': formatTime(schedule.startDate),
    '종료 날짜': schedule.endDate ? formatDate(schedule.endDate) : '',
    '종료 시간': schedule.endDate ? formatTime(schedule.endDate) : '',
    '장소': schedule.location || '',
    '작성자': schedule.authorName,
    '작성일': formatDate(schedule.createdAt),
  }))

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // 열 너비 설정
  const columnWidths = [
    { wch: 30 }, // 제목
    { wch: 40 }, // 설명
    { wch: 12 }, // 시작 날짜
    { wch: 10 }, // 시작 시간
    { wch: 12 }, // 종료 날짜
    { wch: 10 }, // 종료 시간
    { wch: 20 }, // 장소
    { wch: 20 }, // 작성자
    { wch: 12 }, // 작성일
  ]
  worksheet['!cols'] = columnWidths

  // 워크북 생성
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '일정목록')

  // 파일명 생성 (현재 날짜 포함)
  const today = new Date()
  const fileName = `일정목록_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.xlsx`

  // 엑셀 파일 다운로드
  XLSX.writeFile(workbook, fileName)
}

// CSV 형식으로도 내보내기
export function exportSchedulesToCSV(schedules: Schedule[]): void {
  // CSV 데이터 준비
  const headers = ['제목', '설명', '시작 날짜', '시작 시간', '종료 날짜', '종료 시간', '장소', '작성자', '작성일']
  
  const rows = schedules.map(schedule => [
    schedule.title,
    schedule.description,
    formatDate(schedule.startDate),
    formatTime(schedule.startDate),
    schedule.endDate ? formatDate(schedule.endDate) : '',
    schedule.endDate ? formatTime(schedule.endDate) : '',
    schedule.location || '',
    schedule.authorName,
    formatDate(schedule.createdAt),
  ])

  // CSV 문자열 생성
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // BOM 추가 (한글 깨짐 방지)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // 다운로드 링크 생성
  const link = document.createElement('a')
  const today = new Date()
  const fileName = `일정목록_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.csv`
  
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  
  // 메모리 정리
  URL.revokeObjectURL(link.href)
}

// 날짜 포맷팅 헬퍼 함수
function formatDate(timestamp: any): string {
  try {
    if (!timestamp || typeof timestamp.toDate !== 'function') return ''
    const date = timestamp.toDate()
    if (!(date instanceof Date) || isNaN(date.getTime())) return ''
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } catch (error) {
    console.error('Date formatting error in export:', error)
    return ''
  }
}

// 시간 포맷팅 헬퍼 함수
function formatTime(timestamp: any): string {
  try {
    if (!timestamp || typeof timestamp.toDate !== 'function') return ''
    const date = timestamp.toDate()
    if (!(date instanceof Date) || isNaN(date.getTime())) return ''
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (error) {
    console.error('Time formatting error in export:', error)
    return ''
  }
}