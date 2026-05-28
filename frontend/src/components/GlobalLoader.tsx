import React from 'react';
import './GlobalLoader.css';

interface GlobalLoaderProps {
  fullScreen?: boolean;
}

export default function GlobalLoader({ fullScreen = true }: GlobalLoaderProps) {
  if (fullScreen) {
    return (
      <div className="global-loader-container bg-[#09090B]">
        <div className="global-loader-load">
          <div>G</div>
          <div>N</div>
          <div>I</div>
          <div>D</div>
          <div>A</div>
          <div>O</div>
          <div>L</div>
        </div>
      </div>
    );
  }

  // Inline version
  return (
    <div className="relative w-full h-[100px]">
      <div className="global-loader-load" style={{ top: '50%' }}>
        <div>G</div>
        <div>N</div>
        <div>I</div>
        <div>D</div>
        <div>A</div>
        <div>O</div>
        <div>L</div>
      </div>
    </div>
  );
}
