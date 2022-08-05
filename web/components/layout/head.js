import Head from "next/head";

export default ({ title }) => {
  return (
    <Head>
      <meta charSet="utf-8" />
      <meta
        name="description"
        content="Federation provides solutions for communities in the Nouns ecosystem to participate in governance with one another."
      />
      <meta property="og:title" content="federation.wtf" />
      <meta property="og:url" content="https://federation.wtf" />
      <meta property="og:description" content="Nounish Federation" />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22><text y=%221.1em%22 font-size=%2290%22>🌎</text></svg>"
      ></link>
      <title>{title}</title>
    </Head>
  );
};
