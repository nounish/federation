export default () => {
  return (
    <>
      <div className="marquee-wrapper hidden-mobile">
        <div className="lines">
          {[...Array(20).keys()].map((i) => {
            return (
              <ul key={i} className="list">
                <li>⌐@-@</li>
                <li>⌐᳂-᳂</li>
                <li>⌐◧-◧</li>
                <li>⌐♥-♥</li>
                <li>⌐▤-▤</li>
                <li>⌐◨-◨</li>
                <li>⌐@-@</li>
                <li>⌐◮-◮</li>
                <li>⌐⁞⁚⁞-⁞⁚⁞</li>
                <li>⌐●-●</li>
                <li>⌐◳-◳</li>
                <li>⌐◧-◧</li>
              </ul>
            );
          })}
        </div>
        <div className="lines s">
          {[...Array(20).keys()].map((i) => {
            return (
              <ul key={i} className="list">
                <li>⌐🄶-🄼</li>
                <li>⌐◭-◭</li>
                <li>⌐○-○</li>
                <li>⌐◪-◪</li>
                <li>⌐▤-▤</li>
                <li>⌐◨-◨</li>
                <li>⌐🄶-🄼</li>
                <li>⌐▢-▢</li>
                <li>⌐◍-◍</li>
                <li>⌐◪-◪</li>
                <li>⌐▤-▤</li>
                <li>⌐♥-♥</li>
              </ul>
            );
          })}
        </div>
        <div className="lines s2">
          {[...Array(20).keys()].map((i) => {
            return (
              <ul key={i} className="list">
                <li>⌐▨-▨</li>
                <li>⌐Ξ-Ξ</li>
                <li>⌐◧-◧</li>
                <li>⌐@-@</li>
                <li>⌐⁞⁚⁞-⁞⁚⁞</li>
                <li>⌐᳂-᳂</li>
                <li>⌐◪-◪</li>
                <li>⌐♥-♥</li>
                <li>⌐🄶-🄼</li>
                <li>⌐◪-◪</li>
                <li>⌐▤-▤</li>
                <li>⌐@-@</li>
              </ul>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .marquee-wrapper {
          user-select: none;
          width: 100%;
          transform: rotate(-45deg);
          position: absolute;
          left: 25%;
          top: 55%;
        }

        .s {
          left: 35%;
        }

        .s2 {
          right: 35%;
        }

        .lines {
          position: relative;
          display: inline-flex;
          width: 100%;
          justify-content: center;
          align-items: center;
        }

        .list {
          animation-name: marquee;
          animation-duration: 60s;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          flex-shrink: 0;
          margin: 0px;
          padding: 0px;
          opacity: 0.15;
          color: #6758ee;
          font-family: monospace;
          font-size: 5.65rem;
        }

        li {
          width: fit-content;
          display: inline-block;
          list-style: none;
          padding: 0 20px;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </>
  );
};
