import { useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import SignaturePad from 'react-signature-canvas';

const SignatureCanvas = forwardRef(({ onEnd }, ref) => {
  const padRef = useRef();
  const containerRef = useRef();
  const [width, setWidth] = useState(0);

  // Responsive logic to handle canvas resizing
  useEffect(() => {
    if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useImperativeHandle(ref, () => ({
    clear: () => padRef.current?.clear(),
    isEmpty: () => padRef.current?.isEmpty(),
    toDataURL: () => padRef.current?.toDataURL(),
    getTrimmedCanvas: () => padRef.current?.getTrimmedCanvas()
  }));

  return (
    <div ref={containerRef} className="border-2 border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden h-52 w-full touch-none">
        <SignaturePad
            ref={padRef}
            onEnd={onEnd}
            canvasProps={{
                width: width,
                height: 208, // h-52 is 13rem = 208px
                className: 'bg-white cursor-crosshair'
            }}
        />
    </div>
  );
});

export default SignatureCanvas;
