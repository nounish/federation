import styles from "./icons.module.scss";

export const Loader = () => {
  return <div className={`${styles.circleLoader}`}></div>;
};

export const RightArrow = ({ width = "15px" }) => {
  return (
    <>
      <div className="embed">
        <svg viewBox="0 0 25 14" width={width} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 7H23.5M18 13L24 7L18 1" stroke="currentColor" strokeWidth="0.15rem"></path>
        </svg>
      </div>
      <style jsx>{`
        .embed::before {
          content: " ";
          display: table;
        }
      `}</style>
    </>
  );
};

export const GitHub = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" {...props}>
      <path
        fill="rgb(0, 0, 0)"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      ></path>
    </svg>
  );
};

export const Twitter = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 273.5 222.3" {...props}>
      <path
        d="M273.5 26.3a109.77 109.77 0 0 1-32.2 8.8 56.07 56.07 0 0 0 24.7-31 113.39 113.39 0 0 1-35.7 13.6 56.1 56.1 0 0 0-97 38.4 54 54 0 0 0 1.5 12.8A159.68 159.68 0 0 1 19.1 10.3a56.12 56.12 0 0 0 17.4 74.9 56.06 56.06 0 0 1-25.4-7v.7a56.11 56.11 0 0 0 45 55 55.65 55.65 0 0 1-14.8 2 62.39 62.39 0 0 1-10.6-1 56.24 56.24 0 0 0 52.4 39 112.87 112.87 0 0 1-69.7 24 119 119 0 0 1-13.4-.8 158.83 158.83 0 0 0 86 25.2c103.2 0 159.6-85.5 159.6-159.6 0-2.4-.1-4.9-.2-7.3a114.25 114.25 0 0 0 28.1-29.1"
        fill="rgb(0, 0, 0)"
      />
    </svg>
  );
};

export const Noggles = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 178 110" fill="none" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M69.375 39.0625H89.5V79.3125H69.375V39.0625ZM139.812 39.0625H159.938V79.3125H139.812V39.0625Z"
        fill="#000"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M49.25 39.0625H69.375V79.3125H49.25V39.0625ZM119.688 39.0625H139.812V79.3125H119.688V39.0625Z"
        fill="white"
      />
      <path
        d="M109.625 29V49.125H99.5625V29H39.1875V49.125H9V79.3125H19.0625V59.1875H39.1875V89.375H99.5625V59.1875H109.625V89.375H170V29H109.625ZM89.5 79.3125H49.25V39.0625H89.5V79.3125ZM159.938 79.3125H119.688V39.0625H159.938V79.3125Z"
        fill={props.fill}
      />
      <path
        d="M109.625 29V49.125H99.5625V29H39.1875V49.125H9V79.3125H19.0625V59.1875H39.1875V89.375H99.5625V59.1875H109.625V89.375H170V29H109.625ZM89.5 79.3125H49.25V39.0625H89.5V79.3125ZM159.938 79.3125H119.688V39.0625H159.938V79.3125Z"
        fill={props.fill}
      />
      <path
        d="M109.625 29V49.125H99.5625V29H39.1875V49.125H9V79.3125H19.0625V59.1875H39.1875V89.375H99.5625V59.1875H109.625V89.375H170V29H109.625ZM89.5 79.3125H49.25V39.0625H89.5V79.3125ZM159.938 79.3125H119.688V39.0625H159.938V79.3125Z"
        fill={props.fill}
      />
    </svg>
  );
};

export const WizardsDAO = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 11 8" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#6117AD"
        d="M2,6h1h1h1h1h1h1h1V4H8V3H7V1H6V0H2v1H1v2h1V2h1v2H2"
      />
      <path fillRule="evenodd" clipRule="evenodd" fill="#F7BC07" d="M1,6h9v1H9H8H7H6H5H4H3H2H1V6z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#6117AD"
        d="M0,7h1h1h1h1h1h1h1h1h1h1h1v1h-1H9H8H7H6H5H4H3H2H1H0V7z"
      />
    </svg>
  );
};
