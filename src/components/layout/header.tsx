'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [{ href: '/standings', label: 'Standings' }];

export function Header() {
	const pathname = usePathname();

	return (
		<header className="border-b border-border bg-card">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-8">
					<Link href="/" className="flex items-center gap-2 font-semibold">
						<Trophy className="h-5 w-5" />
						<span>FF Data</span>
					</Link>
					<nav className="flex items-center gap-6">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									'text-sm font-medium transition-colors hover:text-foreground',
									pathname === item.href ? 'text-foreground' : 'text-muted-foreground',
								)}
							>
								{item.label}
							</Link>
						))}
					</nav>
				</div>
				<UserButton afterSignOutUrl="/" />
			</div>
		</header>
	);
}
