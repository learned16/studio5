import sys
objs=[]
def o(s): objs.append(s if isinstance(s,bytes) else s.encode())
o("<< /Type /Catalog /Pages 2 0 R >>")
o("<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>")
c1=b"BT /F1 24 Tf 72 760 Td (Limits and continuity lecture) Tj ET"
c2=b"BT /F1 24 Tf 72 760 Td (Derivative definition page two) Tj ET"
o("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 7 0 R >> >> >>")
o(("<< /Length %d >>\nstream\n"%len(c1)).encode()+c1+b"\nendstream")
o("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>")
o(("<< /Length %d >>\nstream\n"%len(c2)).encode()+c2+b"\nendstream")
o("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
out=b"%PDF-1.4\n"; offs=[]
for i,b in enumerate(objs):
    offs.append(len(out)); out+=f"{i+1} 0 obj\n".encode()+b+b"\nendobj\n"
x=len(out); out+=f"xref\n0 {len(objs)+1}\n0000000000 65535 f \n".encode()
for of in offs: out+=f"{of:010d} 00000 n \n".encode()
out+=f"trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{x}\n%%EOF".encode()
open(sys.argv[1],"wb").write(out)
