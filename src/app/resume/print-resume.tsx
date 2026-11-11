'use client';

import { Printer } from 'lucide-react';

export function PrintResume() {
  return <button type="button" onClick={() => window.print()}><Printer size={15} /> 打印 / 保存 PDF</button>;
}
