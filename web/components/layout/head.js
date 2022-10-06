import Head from "next/head";

const isStage = process.env.NEXT_PUBLIC_ENV == "stage";
const uri = isStage ? "https://stage.federation.wtf" : "https://federation.wtf";

export default ({ title }) => {
  return (
    <Head>
      <meta charSet="utf-8" />
      <meta
        name="description"
        content="An on-chain delegated voter which enables communities in the Nouns ecosystem to participate in
        governance with one another."
      />
      <meta property="og:title" content="Federation" />
      <meta property="og:url" content={uri} />
      <meta property="og:image" content={`${uri}/static/img/federationbanner.png`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@0xWiz_" />
      <meta name="twitter:title" content="Federation" />
      <meta name="twitter:image" content={`${uri}/static/img/federationbanner.png`} />

      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22><text y=%221.1em%22 font-size=%2290%22>🌎</text></svg>"
      ></link>
      <title>{title}</title>
    </Head>
  );
};
