import { LucideHeadphones } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils"; // shadcn's utility for merging classes
import { Button } from "@/components/ui/button";
import { withBasePath } from "@/lib/base-path";

export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2">
            <svg width="30" height="35" viewBox="0 0 41 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 7.29812C0 3.51863 3.45223 0.680457 7.16036 1.41139L36.1604 7.12773C38.9726 7.68207 41 10.1481 41 13.0145V32.0088C41 34.9227 38.9063 37.4154 36.0362 37.9186L7.03618 43.0032C3.36408 43.647 0 40.8214 0 37.0933V7.29812Z" fill="#FFBB00" />
                <path d="M18.4747 27.105L18.2447 28.2257C18.2447 28.2257 18.2307 28.3407 18.073 28.2762C18.073 28.2762 17.2858 27.9948 17.0559 27.9586C17.0559 27.9586 16.6004 27.8456 16.1471 27.8456C16.1471 27.8456 15.3206 27.7943 14.7457 28.1182C14.7457 28.1182 14.1785 28.3768 13.9057 29.0668C13.9057 29.0668 13.482 30.1724 14.1001 31.1711C14.1001 31.1711 14.6107 32.0839 16.0181 32.0406C16.0181 32.0406 16.5207 32.0623 17.1096 31.875C17.1096 31.875 17.2594 31.834 17.2396 31.6027V30.7332C17.2396 30.7332 17.2519 30.5675 17.0454 30.5675H15.8674C15.8674 30.5675 15.7374 30.5825 15.7238 30.4314L15.5294 29.5117H18.9346V32.5361C18.9346 32.5361 17.8144 33.1908 15.8955 33.1908C15.8955 33.1908 13.2593 33.3481 12.1957 31.5089C12.1957 31.5089 11.3122 30.108 12.1596 28.434C12.1596 28.434 12.6829 27.3082 14.2864 26.8674C14.2864 26.8674 15.0674 26.6471 15.9532 26.6456C15.9532 26.6456 17.2748 26.6084 18.4747 27.105Z" fill="black" />
                <path d="M19.6237 30.0156C19.5723 28.1538 21.0673 27.3209 21.0673 27.3209C21.5423 27.0193 22.4476 26.6601 23.6976 26.6601C24.9479 26.6601 25.8746 27.0489 25.8746 27.0489L25.6522 28.1835C25.6522 28.1835 25.6087 28.3275 25.493 28.2548C25.493 28.2548 24.7321 27.8523 23.8844 27.867C23.8844 27.867 22.7778 27.7952 22.0885 28.5287C22.0885 28.5287 21.5744 29.0464 21.5854 30.0081C21.5854 30.0081 21.5994 31.1792 22.5194 31.6748C22.5194 31.6748 23.0504 32.0053 23.8699 32.0053C23.8699 32.0053 24.7539 32.0196 25.637 31.5309C25.637 31.5309 25.7528 31.4593 25.7808 31.5746L26.0184 32.7527C26.0184 32.7527 25.0764 33.213 23.6545 33.213C23.6545 33.213 22.1889 33.2561 20.9959 32.5081C20.9959 32.5081 20.306 32.0628 19.9757 31.3806C19.9757 31.3806 19.6454 30.7981 19.6237 30.0156Z" fill="black" />
                <path d="M32.7483 30.3035C32.2885 29.8727 31.4548 29.7435 31.4548 29.7435C31.835 29.6427 32.231 29.4123 32.231 29.4123C32.8633 29.0142 32.8346 28.393 32.8346 28.393C32.8481 27.7175 32.4178 27.3869 32.4178 27.3869C31.6999 26.7297 30.1185 26.7689 30.1185 26.7689H26.8648C26.7565 26.7584 26.7415 26.8662 26.7415 26.8662V32.9618C26.7415 33.0774 26.8427 33.0626 26.8427 33.0626H30.1329C31.369 33.0626 32.0374 32.7463 32.0374 32.7463C33.2507 32.2505 33.1513 31.3093 33.1513 31.3093C33.1865 30.6631 32.7483 30.3035 32.7483 30.3035ZM30.7435 29.1689C30.7435 29.1689 30.4642 29.3736 29.8888 29.3619H28.595V27.7891V27.782H29.9748C29.9748 27.782 30.4775 27.7791 30.7366 27.9471C30.7366 27.9471 31.1029 28.1197 31.1029 28.5365C31.1029 28.5365 31.1382 28.9027 30.7435 29.1689ZM30.9231 31.8411C30.9231 31.8411 30.6219 32.0459 29.9903 32.0473H28.595V30.2788V30.2705H30.083C30.083 30.2705 30.6074 30.2645 30.9051 30.4568C30.9051 30.4568 31.3003 30.6505 31.3003 31.1183C31.3003 31.1183 31.369 31.5825 30.9231 31.8411Z" fill="black" />
                <path d="M30.7162 14.0216C30.7162 14.0216 28.3637 15.5914 24.3085 16.9856C21.7782 17.8556 18.7691 18.2521 18.771 18.255C18.2925 19.0043 17.5705 19.3296 17.0172 19.4703C17.5823 19.4822 17.9719 19.5239 17.9719 19.5239C18.8679 19.6412 18.6734 20.013 18.6734 20.013C19.0498 20.1235 19.3153 20.2588 19.3153 20.2588C19.8925 20.5133 19.1969 21.174 19.1969 21.174C19.2038 20.8886 18.9629 20.826 18.9629 20.826C18.7634 20.76 18.4889 20.8015 18.4889 20.8015C17.9894 20.8597 17.4238 21.1675 17.4238 21.1675C16.7374 21.5173 16.2656 21.8493 16.2656 21.8493C15.7555 22.1589 15.2562 22.5197 15.2562 22.5197C14.5183 21.1086 15.2753 19.6725 15.3714 19.4998C12.6043 18.9866 12.5995 16.0914 12.5995 16.0914C12.5964 13.3761 14.4219 10.7179 14.4289 10.7179C13.7287 10.7571 12.7615 10.9266 12.357 11.0787L11.428 13.8727L11.4655 11.3487C10.9999 11.5047 10.6603 11.6902 10.4563 11.8162L9.75991 14.3441L9.70111 12.2336C9.2918 12.5151 9.18221 12.6327 9.00405 12.8611L8.52686 14.9752L8.10847 14.2439C6.02173 17.9026 8.30392 23.2496 8.30392 23.2496L10.5832 23.247L8.06075 24.783C7.86762 25.2751 7.72641 25.7572 7.6904 26.2066L8.83841 25.9855L7.72252 27.0388C7.77024 27.3597 7.85503 27.6615 7.96531 27.9394L9.08057 26.9687L8.2041 28.4421C8.65417 29.2884 9.24809 29.8099 9.24809 29.8099C10.1762 25.4309 13.786 23.6905 13.786 23.6905L13.7875 25.4375C22.7886 24.4838 26.1419 22.1597 27.8598 20.4951L26.615 20.1056L28.6696 19.6019C28.9021 19.3685 29.1355 19.0273 29.2902 18.7471L27.2713 18.5943L29.6394 18.0489C29.8007 17.8235 30.0182 17.2948 30.1038 17.0781L27.503 17.2353L30.336 16.0294C30.599 15.1246 30.7162 14.0216 30.7162 14.0216Z" fill="black" />
                <path d="M12.377 11.1155H12.3814L12.3917 11.0962L12.377 11.1155Z" fill="black" />
            </svg>
            <p className="text-sm text-white font-bold uppercase tracking-widest">SIDI</p>
        </Link>
    );
}



export function PlainNavbar() {
    return (
        <header className="w-full bg-black border-b border-b-white/5 shadow-none">
            <nav className="flex h-16 items-center justify-between mx-auto max-w-7xl px-6 py-12 md:px-10">
                <Logo />

                <Link
                    href="/help"
                    className="text-sm font-medium text-white transition-colors hover:text-primary"
                >
                    <div className="flex items-center gap-x-2">
                        <LucideHeadphones size={20} />
                        Help
                    </div>
                </Link>
            </nav>
        </header>
    )
}

export type TNavbarProps =
    {
        title: string
        description: string
    }

export function TNavbar(props: TNavbarProps) {
    return (
        <div className="bg-secondary overflow-hidden px-5 pb-10 pt-6 ">
            <div className="relative flex mx-auto max-w-7xl px-6 md:px-10 py-6">
                <span className="pointer-events-none absolute -right-4 -top-5  select-none text-8xl font-extrabold text-white/5">
                    <Image
                        src={withBasePath("/gcb_watermark.svg")}
                        height={150}
                        width={150}
                        alt="watermark"
                    />
                </span>

                <div className="flex items-center gap-3">
                    <Image
                        src={withBasePath("/sidi_woman.png")}
                        height={60}
                        width={60}
                        unoptimized
                        alt="watermark"
                        style={{ width: '60px', height: 'auto' }}
                    />
                    <div>
                        <p className="flex items-center gap-1 text-2xl font-semibold text-primary">
                            Hi Justice <span aria-hidden="true">👋</span>
                        </p>
                        <p className="text-slate-300">
                            I&apos;m Sidi. I&apos;ll guide you through setting up your
                            account
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}


export function SliverAppBar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      // Collapse the app bar once the user scrolls down more than 60 pixels
      if (window.scrollY > 60) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* The Animated Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between px-6 border-b transition-all duration-300 ease-in-out",
          // Conditional classes based on scroll state
          isCollapsed 
            ? "h-16 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm" 
            : "h-48 bg-primary text-primary-foreground shadow-none"
        )}
      >
        {/* Background Image / Pattern overlay (Fades out when collapsed) */}
        <div 
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-300 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))]",
            isCollapsed ? "opacity-0" : "opacity-20 from-sky-400 via-blue-500 to-indigo-600"
          )}
        />

        {/* Content Container */}
        <div className="relative z-10 flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Title - Adjusts position and size smoothly */}
          <h1
            className={cn(
              "font-bold tracking-tight transition-all duration-300 ease-in-out origin-left",
              isCollapsed 
                ? "text-xl translate-y-0 scale-100" 
                : "text-3xl md:text-4xl translate-y-12 scale-105"
            )}
          >
            My Project App
          </h1>

          {/* Navigation Items (Uses shadcn styling variables) */}
          <nav className="flex items-center space-x-4">
            <Link 
              href="#" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-sky-400",
                isCollapsed ? "text-muted-foreground" : "text-primary-foreground/80"
              )}
            >
              Overview
            </Link>
            {/* Swapping variants dynamically based on header background */}
            <Button variant={isCollapsed ? "default" : "secondary"} size="sm">
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Spacer to push page content below the fixed header */}
      <div className="pt-48" />
    </>
  );
}
