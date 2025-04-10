export function processGetDateTimeStrings(unixTimestamp) {
    // Convert to milliseconds if the timestamp is in seconds
    if (unixTimestamp.toString().length === 10) {
        unixTimestamp *= 1000;
    }

    const date = new Date(unixTimestamp);

    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };

    const estFormatter = new Intl.DateTimeFormat('en-US', {
        ...options,
        timeZone: 'America/New_York',
    });

    const istFormatter = new Intl.DateTimeFormat('en-IN', {
        ...options,
        timeZone: 'Asia/Kolkata',
    });

    const [estDate, estTime] = estFormatter.format(date).split(', ');
    const [istDate, istTime] = istFormatter.format(date).split(', ');

    return `${estDate} ${estTime} EST, ${istDate} ${istTime} IST`;
}
