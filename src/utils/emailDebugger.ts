export class EmailDebugger {
  static testEmailValidation(email: string): {
    original: string;
    trimmed: string;
    length: number;
    hasSpaces: boolean;
    hasAt: boolean;
    hasDot: boolean;
    regexTest: boolean;
    parts: {
      beforeAt: string;
      afterAt: string;
      domain: string;
      extension: string;
    } | null;
    issues: string[];
  } {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexTest = emailRegex.test(trimmed);
    
    const issues: string[] = [];
    
    // Analisi dettagliata
    const hasSpaces = /\s/.test(email);
    const hasAt = email.includes('@');
    const hasDot = email.includes('.');
    
    if (hasSpaces) issues.push('Contiene spazi');
    if (!hasAt) issues.push('Manca il simbolo @');
    if (!hasDot) issues.push('Manca il punto');
    
    let parts = null;
    if (hasAt) {
      const atIndex = trimmed.indexOf('@');
      const beforeAt = trimmed.substring(0, atIndex);
      const afterAt = trimmed.substring(atIndex + 1);
      
      if (beforeAt.length === 0) issues.push('Parte prima di @ vuota');
      if (afterAt.length === 0) issues.push('Parte dopo @ vuota');
      
      const lastDotIndex = afterAt.lastIndexOf('.');
      if (lastDotIndex === -1) {
        issues.push('Dominio senza estensione');
      } else {
        const domain = afterAt.substring(0, lastDotIndex);
        const extension = afterAt.substring(lastDotIndex + 1);
        
        if (domain.length === 0) issues.push('Nome dominio vuoto');
        if (extension.length === 0) issues.push('Estensione vuota');
        if (extension.length < 2) issues.push('Estensione troppo corta');
        
        parts = { beforeAt, afterAt, domain, extension };
      }
    }
    
    return {
      original: email,
      trimmed,
      length: trimmed.length,
      hasSpaces,
      hasAt,
      hasDot,
      regexTest,
      parts,
      issues
    };
  }
  
  static logDetailedValidation(email: string): void {
    const result = this.testEmailValidation(email);
    
    console.group('🔍 ANALISI DETTAGLIATA EMAIL');
    console.log('📧 Email originale:', `"${result.original}"`);
    console.log('✂️ Email trimmed:', `"${result.trimmed}"`);
    console.log('📏 Lunghezza:', result.length);
    console.log('🔤 Ha spazi:', result.hasSpaces);
    console.log('@ Ha @:', result.hasAt);
    console.log('• Ha punto:', result.hasDot);
    console.log('✅ Regex test:', result.regexTest);
    
    if (result.parts) {
      console.log('📋 Parti:');
      console.log('  - Prima di @:', `"${result.parts.beforeAt}"`);
      console.log('  - Dopo @:', `"${result.parts.afterAt}"`);
      console.log('  - Dominio:', `"${result.parts.domain}"`);
      console.log('  - Estensione:', `"${result.parts.extension}"`);
    }
    
    if (result.issues.length > 0) {
      console.log('⚠️ Problemi trovati:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    } else if (!result.regexTest) {
      console.log('⚠️ Email non valida ma nessun problema specifico trovato');
    }
    
    console.groupEnd();
  }
}