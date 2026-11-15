import os,ctypes,struct,sys,runpy
from pathlib import Path
if sys.platform=="win32":
    from ctypes import wintypes as wt
    k=ctypes.WinDLL("kernel32",use_last_error=True);n=ctypes.WinDLL("ntdll")
    k.CreateFileW.argtypes=[wt.LPCWSTR,wt.DWORD,wt.DWORD,ctypes.c_void_p,wt.DWORD,wt.DWORD,wt.HANDLE];k.CreateFileW.restype=wt.HANDLE
    k.CloseHandle.argtypes=[wt.HANDLE];k.CloseHandle.restype=wt.BOOL
    class IOSB(ctypes.Structure):_fields_=[("Status",ctypes.c_void_p),("Information",ctypes.c_size_t)]
    n.NtSetEaFile.argtypes=[wt.HANDLE,ctypes.POINTER(IOSB),ctypes.c_void_p,wt.ULONG];n.NtSetEaFile.restype=ctypes.c_long
    n.NtQueryEaFile.argtypes=[wt.HANDLE,ctypes.POINTER(IOSB),ctypes.c_void_p,wt.ULONG,ctypes.c_ubyte,ctypes.c_void_p,wt.ULONG,ctypes.c_void_p,ctypes.c_ubyte];n.NtQueryEaFile.restype=ctypes.c_long
    def handle(path,access):
        h=k.CreateFileW(os.fspath(path),access,7,None,3,0,None)
        if h==ctypes.c_void_p(-1).value:raise ctypes.WinError(ctypes.get_last_error())
        return h
    def fail(status):
        if status<0:raise OSError("NTFS extended attribute status "+hex(status&0xffffffff))
    def setxattr(path,name,value,flags=0,**kw):
        nb=os.fsencode(name);v=bytes(value);blob=struct.pack("<IBBH",0,0,len(nb),len(v))+nb+b"\0"+v;buf=ctypes.create_string_buffer(blob);io=IOSB();h=handle(path,0x18)
        try:fail(n.NtSetEaFile(h,ctypes.byref(io),buf,len(blob)))
        finally:k.CloseHandle(h)
    def getxattr(path,name,**kw):
        nb=os.fsencode(name);query=struct.pack("<IB",0,len(nb))+nb+b"\0";qb=ctypes.create_string_buffer(query);out=ctypes.create_string_buffer(65536);io=IOSB();h=handle(path,0x8)
        try:fail(n.NtQueryEaFile(h,ctypes.byref(io),out,len(out),1,qb,len(query),None,1))
        finally:k.CloseHandle(h)
        _,_,nl,vl=struct.unpack_from("<IBBH",out.raw);return out.raw[9+nl:9+nl+vl]
    os.setxattr=setxattr;os.getxattr=getxattr
if __name__=="__main__":
    if sys.argv[1]=="self-check":
        p=Path(sys.argv[2]);p.write_text("Library metadata compatibility test",encoding="utf-8")
        os.setxattr(p,"user.library-check",b"verified")
        assert os.getxattr(p,"user.library-check")==b"verified"
        print("Windows file metadata verified")
    else:
        helper=Path(__file__).parent/"helpers"/"library_file_transfer.py"
        sys.path.insert(0,str(helper.parent));sys.argv=[str(helper),*sys.argv[1:]]
        runpy.run_path(str(helper),run_name="__main__")

