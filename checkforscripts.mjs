export function checkForScripts(data) {
    if (!data || typeof data !== 'string' || data.length < 1) {
        return false;
    }

    // --- STEP 1: Skip scanning if looks like base64 image ---
    // e.g. data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...
    const base64ImagePattern = /^data:image\/[a-zA-Z0-9+.-]+;base64,/;
    if (base64ImagePattern.test(data)) {
        // definitely an image
        return false;
    }

    // --- STEP 2: Detect if this is raw base64 data ---
    const maybeBase64 = /^[A-Za-z0-9+/=\s]+$/.test(data) && (data.replace(/\s+/g, '').length % 4 === 0);
    if (maybeBase64 && data.length > 500) {
        try {
            const buffer = Buffer.from(data.replace(/\s+/g, ''), 'base64');
            // JPEG magic bytes: FF D8 FF
            if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return false;
            // PNG: 89 50 4E 47
            if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return false;
            // GIF: 47 49 46 38
            if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return false;
            // WEBP: RIFF (52 49 46 46)
            if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return false;

            // If not an image but binary (not readable UTF-8), skip scanning
            const text = buffer.toString('utf8');
            const printableRatio = text.split('').filter(ch => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) < 127).length / text.length;
            if (printableRatio < 0.6) return false; // mostly binary
            data = text;
        } catch {
            // ignore decode errors, keep data as-is
        }
    }

    // --- STEP 3: Define your detection patterns (same as before) ---
    const patterns = [
        { name: "Inline Script", regex: /<script\b[^>]*>[\s\S]*?<\/script>/i },
        { name: "Event Handler", regex: /on\w+\s*=\s*["']?[^"'>]+["']?/i },
        { name: "JS Protocol", regex: /javascript\s*:/i },
        { name: "JS Exec Function", regex: /\b(eval|document\.write|setTimeout|setInterval|Function|new Function)\s*\(/i },
        { name: "Base64 HTML Payload", regex: /data:\s*text\/html;\s*base64,/i },

        { name: "Python Exec Function", regex: /\b(exec|eval|compile|globals|locals|vars|input)\s*\(/i },
        { name: "Python OS Commands", regex: /\b(os\.system|subprocess\.\w+|shutil\.\w+|os\.remove|os\.popen)\s*\(/i },
        { name: "Python Networking", regex: /\b(socket|requests|urllib|ftplib)\b/i },
        { name: "Python Obfuscation", regex: /\b(base64\.b64decode|marshal|zlib|codecs\.decode)\s*\(/i },

        { name: "VBA Macro", regex: /\b(Sub\s+\w+\s*\(|Function\s+\w+\s*\(|Public\s+Sub\s+\w+\s*\()/i },
        { name: "Windows Scripting", regex: /\b(WScript\.Shell|CreateObject\("WScript\.Shell"\)|Shell\.Run|ShellExecute)\b/i },
        // stricter PowerShell pattern (word boundaries)
        { name: "PowerShell Commands", regex: /\b(Invoke-Expression|IEX)\b/i },

        { name: "Unix Shell", regex: /\b(bin\/sh|bin\/bash|bash -c|sh -c|exec\()/i },
        { name: "Windows Execution", regex: /\b(mshta|rundll32|regsvr32|certutil|wmic|powershell|cmd)\b/i },
        { name: "Executable Files", regex: /\.(exe|dll|bat|cmd|sh)\b/i },

        { name: "SQL Queries", regex: /(\bUNION\b.*\bSELECT\b|\bSELECT\b.*\bFROM\b|\bINSERT\b.*\bINTO\b|\bUPDATE\b.*\bSET\b|\bDELETE\b.*\bFROM\b)/i },
        { name: "SQL Destruction", regex: /(\bDROP\b.*\bTABLE\b|\bALTER\b.*\bTABLE\b|\bCREATE\b.*\bTABLE\b|\bEXEC\b.*\bxp_cmdshell\b)/i },
        { name: "SQL Injection", regex: /(['"]\s*;\s*(--|#|\/\*|\bOR\b|\bAND\b|\bLIKE\b|\bNOT\b|\bIN\b|\bEXISTS\b|\bCASE\b))/i }
    ];

    // --- STEP 4: Scan textual content only ---
    const maxScanLength = 200000; // prevent performance issues
    const text = data.slice(0, maxScanLength);

    for (const { name, regex } of patterns) {
        const match = text.match(regex);
        if (match) {
            console.warn(`⚠️ Detected [${name}]: ${match[0].slice(0, 100)}`);
            return true;
        }
    }

    return false;
}
