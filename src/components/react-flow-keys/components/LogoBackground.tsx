import { memo } from "react";
import Logo from "/logos/LogoBlack.svg";

const LogoBackground = ({ backgroundColor }: { backgroundColor?: string }) => {
  const sizeMult = 0.5;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0, // Ensure it's behind the nodes
        backgroundColor: backgroundColor,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Define a filter to turn the image gray */}
        <filter id="gray-filter">
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.87
                    0 0 0 0 0.87
                    0 0 0 0 0.87
                    0 0 0 0.5 0"
          />
        </filter>
      </defs>

      <pattern
        id="bg-pattern"
        patternUnits="userSpaceOnUse"
        width={160 * sizeMult} // Increase the width to provide more space for the image
        height={150 * sizeMult} // Increase the height to provide more space for the image
      >
        <g>
          {/* First row of images */}
          <image
            href={Logo}
            x="0"
            y="0"
            width={50 * sizeMult} // Adjust width to fit within the pattern size
            height={50 * sizeMult} // Adjust height to fit within the pattern size
            filter="url(#gray-filter)"
          />

          {/* Second row of images, offset by 150px to the right and 150px down */}
          <image
            href={Logo}
            x={85 * sizeMult} // Adjust the horizontal offset
            y={75 * sizeMult} // Adjust the vertical offset
            width={50 * sizeMult}
            height={50 * sizeMult}
            filter="url(#gray-filter)"
          />
        </g>
      </pattern>

      <rect x="0" y="0" width="100%" height="100%" fill="url(#bg-pattern)" />
    </svg>
  );
};

export default memo(LogoBackground);
