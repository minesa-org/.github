import { useLocation } from "react-router-dom";
import { HomeIcon } from "../icons/HomeIcon";
import { TeamIcon } from "../icons/TeamIcon";
import { ProjectsIcon } from "../icons/ProjectsIcon";
import { DonationIcon } from "../icons/DonationIcon";
import styles from "../styles/Header.module.css";

const navItems = [
    { href: "/", label: "Home", Icon: HomeIcon },
    { href: "/team", label: "Team", Icon: TeamIcon },
    { href: "/projects", label: "Projects", Icon: ProjectsIcon },
    { href: "/donation", label: "Donation", Icon: DonationIcon },
];

const Header = () => {
    const location = useLocation();

    return (
        <header className={styles.header}>
            <h1>[minesa]</h1>
            <nav className={styles.nav}>
                {navItems.map(({ href, label, Icon }) => {
                    const isActive = location.pathname === href;
                    return (
                        <a
                            key={href}
                            href={href}
                            className={`${styles.link} ${
                                styles[label.toLowerCase()]
                            } ${isActive ? styles.active : ""}`}>
                            <Icon />
                            <span>{label}</span>
                        </a>
                    );
                })}
            </nav>
        </header>
    );
};

export default Header;
