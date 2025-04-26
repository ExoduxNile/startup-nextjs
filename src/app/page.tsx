import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import Brands from "@/components/Brands";
import ScrollUp from "@/components/Common/ScrollUp";
import Contact from "@/components/Contact";
import InstagramScraper from "@/components/InstagramScraper";
import Video from "@/components/Video";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Next.js Template for Startup and SaaS",
  description: "This is Home for Startup Nextjs Template",
  // other metadata
};

export default function Home() {
  return (
    <>
      {/* <ScrollUp /> */}
      <InstagramScraper />
      {/* <Video />
      <Brands />
      <AboutSectionOne />
      <AboutSectionTwo />

      <Contact /> */}
    </>
  );
}
