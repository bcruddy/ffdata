import { Github } from 'lucide-react';

export function Footer() {
	return (
		<footer className="border-t border-border bg-card">
			<div className="container mx-auto flex items-center justify-between px-4 py-4">
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<span>Privacy</span>
					<span>Terms</span>
				</div>
				<a
					href="https://github.com/bcruddy/ffdata"
					target="_blank"
					rel="noopener noreferrer"
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					<Github className="h-5 w-5" />
					<span className="sr-only">GitHub</span>
				</a>
			</div>
		</footer>
	);
}
