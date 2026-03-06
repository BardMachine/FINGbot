const weeks = require('../weeks.json');

function parseLocalDate(str) {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getCurrentWeek() {
  const today = new Date();

  for (const [weekName, data] of Object.entries(weeks)) {
    const startDate = parseLocalDate(data.start);
    const endDate = parseLocalDate(data.end);

    if (today >= startDate && today <= endDate) {
      return {
        weekName,
        start: data.start,
        end: data.end,
        pageStart: data.pageStart,
        pageEnd: data.pageEnd
      };
    }
  }

  return null;
}

function getWeek(name) {
  const data = weeks[name];
  if (!data) return null;

  return {
    weekName: name,
    start: data.start,
    end: data.end,
    pageStart: data.pageStart,
    pageEnd: data.pageEnd
  };
}

module.exports = {
  getCurrentWeek,
  getWeek
};