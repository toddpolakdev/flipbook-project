"use client";

import { Menu } from "@mantine/core";
import { signIn, signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut, Plus, User } from "lucide-react";
import Link from "next/link";
import styles from "./AuthButton.module.css";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className={styles.skeleton} aria-hidden="true" />;
  }

  if (!session) {
    return (
      <button
        type="button"
        className={styles.signIn}
        onClick={() => signIn("google")}>
        <GoogleMark />
        Sign in
      </button>
    );
  }

  const user = session.user;
  const name = user?.name || user?.email || "Account";
  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <Menu
      position="bottom-end"
      offset={8}
      width={230}
      radius="md"
      shadow="md"
      classNames={{ dropdown: styles.dropdown, item: styles.item }}>
      <Menu.Target>
        <button type="button" className={styles.trigger} aria-label="Account menu">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className={styles.avatar} />
          ) : (
            <span className={styles.avatarFallback}>{initial}</span>
          )}
          <ChevronDown size={14} className={styles.chevron} />
        </button>
      </Menu.Target>

      <Menu.Dropdown>
        <div className={styles.who}>
          <span className={styles.whoName}>{name}</span>
          {user?.email && user.email !== name && (
            <span className={styles.whoEmail}>{user.email}</span>
          )}
        </div>

        <Menu.Divider className={styles.divider} />

        <Menu.Item
          component={Link}
          href="/flipbook/new"
          leftSection={<Plus size={15} />}>
          New flipbook
        </Menu.Item>
        <Menu.Item component={Link} href="/" leftSection={<User size={15} />}>
          Your flipbooks
        </Menu.Item>

        <Menu.Divider className={styles.divider} />

        <Menu.Item
          className={styles.signOut}
          leftSection={<LogOut size={15} />}
          onClick={() => signOut()}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

function GoogleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.6 7l-.1.3 6.7 5.2.5.1c4.2-3.9 6.6-9.7 6.6-15.9z"
      />
      <path
        fill="#34A853"
        d="M24 46c6.1 0 11.2-2 14.9-5.5l-7.1-5.5c-1.9 1.3-4.4 2.2-7.8 2.2-6 0-11-3.9-12.8-9.3l-7.2 5.5C7.6 40.9 15.2 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.2 27.9c-.5-1.4-.8-2.9-.8-4.4s.3-3 .7-4.4l-7.2-5.5C2.4 16.5 1.5 20.1 1.5 23.5s.9 7 2.4 10.1l7.3-5.7z"
      />
      <path
        fill="#EB4335"
        d="M24 9.8c4.3 0 7.2 1.8 8.8 3.4l6.4-6.2C35.2 3.3 30.1 1 24 1 15.2 1 7.6 6.1 3.9 13.6l7.3 5.7C13 13.8 18 9.8 24 9.8z"
      />
    </svg>
  );
}
