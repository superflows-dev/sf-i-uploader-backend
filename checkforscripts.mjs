export function checkForScripts(data) {
    const patterns = [
        // JavaScript/XSS Attacks
        /<script\b[^>]*>[\s\S]*?<\/script>/i,  // Inline scripts
        /on\w+\s*=\s*["']?[^"'>]+["']?/i,  // Event handlers (onerror, onclick)
        /javascript\s*:/i,  // JavaScript protocol
        /\b(eval|document\.write|setTimeout|setInterval|Function|new Function)\s*\(/i,  // JS execution functions
        /data:\s*text\/html;\s*base64,/i,  // Base64 encoded payloads

        // Python Code Execution
        /\b(exec|eval|compile|globals|locals|vars|input)\s*\(/i,  // Dangerous execution functions
        /\b(os\.system|subprocess\.\w+|shutil\.\w+|os\.remove|os\.popen)\s*\(/i,  // OS execution functions
        /\b(socket|requests|urllib|ftplib)\b/i,  // Networking libraries
        /\b(base64\.b64decode|marshal|zlib|codecs\.decode)\s*\(/i,  // Obfuscation libraries

        // Macros & PowerShell Commands
        /(Sub\s+\w+\s*\(|Function\s+\w+\s*\(|Public\s+Sub\s+\w+\s*\()/i,  // VBA Macros
        /\b(WScript\.Shell|CreateObject\("WScript\.Shell"\)|Shell\.Run|ShellExecute)\b/i,  // Windows Scripting
        /\b(powershell\s+-[cC]|cmd\s+\/c|Invoke-Expression|IEX)\b/i,  // PowerShell execution

        // Executable Code (Shell, EXE, DLL)
        /\b(bin\/sh|bin\/bash|bash -c|sh -c|exec\()/i,  // Unix Shell Commands
        /\b(mshta|rundll32|regsvr32|certutil|wmic|powershell|cmd)\b/i,  // Windows execution commands
        /\.(exe|dll|bat|cmd|sh)\b/i,  // Executable files

        // SQL Injection Attacks
        /(\bUNION\b.*\bSELECT\b|\bSELECT\b.*\bFROM\b|\bINSERT\b.*\bINTO\b|\bUPDATE\b.*\bSET\b|\bDELETE\b.*\bFROM\b)/i,  // SQL Queries
        /(\bDROP\b.*\bTABLE\b|\bALTER\b.*\bTABLE\b|\bCREATE\b.*\bTABLE\b|\bEXEC\b.*\bxp_cmdshell\b)/i,  // SQL Destruction
        /(['"]\s*;\s*(--|#|\/\*|\bOR\b|\bAND\b|\bLIKE\b|\bNOT\b|\bIN\b|\bEXISTS\b|\bCASE\b))/i  // SQL Injection
    ];

    return patterns.some(pattern => pattern.test(data));
}