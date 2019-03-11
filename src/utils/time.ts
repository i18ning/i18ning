export const getYear = ( date: Date ) => date.getFullYear()
export const getMonth = ( date: Date ) => date.getMonth() + 1
export const getDate = ( date: Date ) => date.getDate()
export const getHours = ( date: Date ) => date.getHours()
export const getMinutes = ( date: Date ) => date.getMinutes()
export const getSeconds = ( date: Date ) => date.getSeconds()

export const formatNormalDate = ( theDate: Date = new Date() ) => {
  const year = getYear( theDate )
  const month = getMonth( theDate )
  const date = getDate( theDate )
  const hours = getHours( theDate )
  const minutes = getMinutes( theDate )
  const seconds = getSeconds( theDate )

  return `${year}-${month}-${date}--${hours}:${minutes}:${seconds}`
}
