
export const clampDay=(d: Date)=> {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export const  isBeforeDay=(a: Date, b: Date) => {
    return clampDay(a).getTime() < clampDay(b).getTime();
  }
  
