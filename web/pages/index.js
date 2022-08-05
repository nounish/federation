import Layout from "../components/layout/home";
import Hero from "../components/home/hero";
import Marquee from "../components/home/marquee";

export default () => {
  return (
    <Layout title="federation.wtf">
      <Hero />
      <div style={{ position: "relative" }}>
        <Marquee />
      </div>
    </Layout>
  );
};
