// DotHub — Tool auto-detection engine
// Pure, deterministic, NO AI tokens burned.
// Maps file paths to known developer tools with categories and icons.

export interface DetectedTool {
  name: string;
  category:
    | "terminal"
    | "shell"
    | "editor"
    | "window_manager"
    | "bar"
    | "launcher"
    | "compositor"
    | "notification"
    | "theme"
    | "font"
    | "mail"
    | "browser"
    | "file_manager"
    | "media"
    | "monitor"
    | "misc";
  icon: string; // lucide icon name
  configFile: string; // matched file path
}

interface DetectionRule {
  name: string;
  category: DetectedTool["category"];
  icon: string;
  patterns: RegExp[];
}

// Rules ordered by specificity (more specific patterns first)
const RULES: DetectionRule[] = [
  // === Terminals ===
  {
    name: "Alacritty",
    category: "terminal",
    icon: "Terminal",
    patterns: [/alacritty\.(yml|toml)$/i],
  },
  {
    name: "Kitty",
    category: "terminal",
    icon: "Terminal",
    patterns: [/kitty\.conf$/i, /kitty\/kitty\.conf$/],
  },
  {
    name: "WezTerm",
    category: "terminal",
    icon: "Terminal",
    patterns: [/wezterm\.lua$/i, /\.wezterm\.lua$/],
  },
  {
    name: "iTerm2",
    category: "terminal",
    icon: "Terminal",
    patterns: [/iterm2\/.*\.json$/i, /com\.googlecode\.iterm2\.plist$/],
  },
  {
    name: "Hyper",
    category: "terminal",
    icon: "Terminal",
    patterns: [/\.hyper\.js$/i, /hyper\.js$/],
  },
  {
    name: "tmux",
    category: "terminal",
    icon: "PanelRightDashed",
    patterns: [/\.tmux\.conf$/i, /tmux\/tmux\.conf$/i, /tmux\.conf$/],
  },

  // === Shells ===
  {
    name: "Zsh",
    category: "shell",
    icon: "Terminal",
    patterns: [
      /\.zshrc$/,
      /\.zshenv$/,
      /\.zprofile$/,
      /\.zlogin$/,
      /zsh\/\.?(zshrc|zshenv|zprofile|zlogin)/,
    ],
  },
  {
    name: "Bash",
    category: "shell",
    icon: "Terminal",
    patterns: [/\.bashrc$/, /\.bash_profile$/, /\.bash_aliases$/, /bash\/\.?bashrc/],
  },
  {
    name: "Fish",
    category: "shell",
    icon: "Fish",
    patterns: [/config\.fish$/i, /fish\/config\.fish$/i],
  },
  {
    name: "Nushell",
    category: "shell",
    icon: "Terminal",
    patterns: [/env\.nu$/i, /config\.nu$/i, /\.nu$/],
  },

  // === Editors ===
  {
    name: "Neovim",
    category: "editor",
    icon: "FileCode",
    patterns: [
      /init\.lua$/i,
      /init\.vim$/i,
      /nvim\/init\.lua$/i,
      /nvim\/init\.vim$/i,
      /nvim\/lua\/.*\.lua$/i,
      /\.vimrc$/,
      /vim\/\.vimrc$/,
    ],
  },
  {
    name: "VS Code",
    category: "editor",
    icon: "FileCode",
    patterns: [
      /vscode\/settings\.json$/i,
      /vscode\/keybindings\.json$/i,
      /Code\/User\/settings\.json$/i,
      /Code\s-\sOSS\/User\/settings\.json$/i,
    ],
  },
  {
    name: "Emacs",
    category: "editor",
    icon: "FileCode",
    patterns: [/\.emacs$/i, /\.emacs\.d\/init\.el$/i, /emacs\/init\.el$/i, /early-init\.el$/i],
  },
  {
    name: "Helix",
    category: "editor",
    icon: "FileCode",
    patterns: [/helix\/config\.toml$/i],
  },
  {
    name: "LazyVim",
    category: "editor",
    icon: "FileCode",
    patterns: [/lazyvim\.json$/i, /lazy-lock\.json$/i],
  },

  // === Window Managers ===
  {
    name: "Hyprland",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/hyprland\.conf$/i, /hypr\/hyprland\.conf$/i],
  },
  {
    name: "i3",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/i3\/config$/i, /\.i3\/config$/i, /i3status\/config$/i],
  },
  {
    name: "Sway",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/sway\/config$/i, /\.sway\/config$/i],
  },
  {
    name: "AwesomeWM",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/awesome\/rc\.lua$/i, /\.config\/awesome\/rc\.lua$/i],
  },
  {
    name: "bspwm",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/bspwm\/bspwmrc$/i, /\.config\/bspwm\/bspwmrc$/i],
  },
  {
    name: "qtile",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/qtile\/config\.py$/i, /\.config\/qtile\/config\.py$/i],
  },
  {
    name: "xmonad",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/xmonad\.hs$/i, /xmonad\/xmonad\.hs$/i],
  },

  // === Bars ===
  {
    name: "Polybar",
    category: "bar",
    icon: "SeparatorHorizontal",
    patterns: [/polybar\/config(\.ini)?$/i, /\.config\/polybar\/config/i],
  },
  {
    name: "Waybar",
    category: "bar",
    icon: "SeparatorHorizontal",
    patterns: [/waybar\/config$/i, /waybar\/style\.css$/i],
  },
  {
    name: "Eww",
    category: "bar",
    icon: "SeparatorHorizontal",
    patterns: [/eww\.(yuck|scss)$/i, /eww\/.*\.(yuck|scss)$/i],
  },

  // === Launchers ===
  {
    name: "Rofi",
    category: "launcher",
    icon: "Search",
    patterns: [/rofi\/config\.rasi$/i, /\.config\/rofi\/config\.rasi$/i],
  },
  {
    name: "wofi",
    category: "launcher",
    icon: "Search",
    patterns: [/wofi\/config$/i, /\.config\/wofi\/config$/i],
  },
  {
    name: "Ulauncher",
    category: "launcher",
    icon: "Search",
    patterns: [/ulauncher\/settings\.json$/i, /ulauncher\/shortcuts\.json$/i],
  },

  // === Compositors ===
  {
    name: "Picom",
    category: "compositor",
    icon: "ScanEye",
    patterns: [/picom\.(conf|toml)$/i, /picom\/picom\.(conf|toml)$/i, /\.config\/picom/i],
  },

  // === Notifications ===
  {
    name: "Dunst",
    category: "notification",
    icon: "Bell",
    patterns: [/dunst\/dunstrc$/i, /\.config\/dunst\/dunstrc$/i],
  },
  {
    name: "mako",
    category: "notification",
    icon: "Bell",
    patterns: [/mako\/config$/i, /\.config\/mako\/config$/i],
  },

  // === Shell Themes / Prompts ===
  {
    name: "Starship",
    category: "theme",
    icon: "Rocket",
    patterns: [/starship\.toml$/i, /\.config\/starship\.toml$/i],
  },
  {
    name: "Oh My Zsh",
    category: "theme",
    icon: "Rocket",
    patterns: [/\.oh-my-zsh/i, /oh-my-zsh\.sh$/i, /ohmyzsh/i],
  },
  {
    name: "p10k",
    category: "theme",
    icon: "Rocket",
    patterns: [/p10k\.zsh$/i, /powerlevel10k/i, /\.p10k\.zsh$/],
  },

  // === Fonts ===
  {
    name: "Nerd Fonts",
    category: "font",
    icon: "Text",
    patterns: [/nerd[\s_-]?font/i],
  },

  // === Mail ===
  {
    name: "Neomutt",
    category: "mail",
    icon: "Mail",
    patterns: [/neomutt/i, /mutt\/muttrc$/i],
  },
  {
    name: "Thunderbird",
    category: "mail",
    icon: "Mail",
    patterns: [/thunderbird/i],
  },

  // === Browsers ===
  {
    name: "qutebrowser",
    category: "browser",
    icon: "Globe",
    patterns: [/qutebrowser\/config\.py$/i],
  },

  // === File Managers ===
  {
    name: "lf",
    category: "file_manager",
    icon: "Folder",
    patterns: [/lf\/lfrc$/i, /\.config\/lf\/lfrc$/i],
  },
  {
    name: "ranger",
    category: "file_manager",
    icon: "Folder",
    patterns: [/ranger\/rc\.conf$/i, /\.config\/ranger\/rc\.conf$/i],
  },
  {
    name: "yazi",
    category: "file_manager",
    icon: "Folder",
    patterns: [/yazi\/ya\.toml$/i, /yazi\/keymap\.toml$/i, /\.config\/yazi\//i],
  },
  {
    name: "nnn",
    category: "file_manager",
    icon: "Folder",
    patterns: [/nnn\/plugins/i],
  },

  // === Media / Music ===
  {
    name: "mpd",
    category: "media",
    icon: "Music",
    patterns: [/mpd\/mpd\.conf$/i, /\.config\/mpd\/mpd\.conf$/i],
  },
  {
    name: "ncmpcpp",
    category: "media",
    icon: "Music",
    patterns: [/ncmpcpp\/config$/i, /\.config\/ncmpcpp\/config$/i],
  },

  // === System Monitors ===
  {
    name: "btop",
    category: "monitor",
    icon: "Activity",
    patterns: [/btop\/btop\.conf$/i, /\.config\/btop\/btop\.conf$/i],
  },
  {
    name: "fastfetch",
    category: "monitor",
    icon: "Activity",
    patterns: [/fastfetch\/config\.jsonc$/i, /\.config\/fastfetch/i],
  },
  {
    name: "neofetch",
    category: "monitor",
    icon: "Activity",
    patterns: [/neofetch\/config\.conf$/i, /\.config\/neofetch/i],
  },

  // === Misc ===
  {
    name: "Git",
    category: "misc",
    icon: "GitBranch",
    patterns: [/\.gitconfig$/, /\.gitignore$/, /git\/\.gitconfig$/],
  },
  {
    name: "Ripgrep",
    category: "misc",
    icon: "Search",
    patterns: [/ripgrep/i, /\.rgignore$/],
  },
  {
    name: "bat",
    category: "misc",
    icon: "FileText",
    patterns: [/bat\/config$/i, /\.config\/bat\/config$/i],
  },
  {
    name: "fzf",
    category: "misc",
    icon: "List",
    patterns: [/fzf\/\.fzfrc$/i, /\.fzfrc$/, /\.fzf\.zsh$/],
  },
  {
    name: "lazygit",
    category: "misc",
    icon: "GitBranch",
    patterns: [/lazygit\/config\.yml$/i, /\.config\/lazygit\/config\.yml$/i],
  },
  {
    name: "Mise",
    category: "misc",
    icon: "Package",
    patterns: [/\.mise\.toml$/i, /mise\/config\.toml$/i],
  },
  {
    name: "Homebrew",
    category: "misc",
    icon: "Package",
    patterns: [/Brewfile$/i, /\.Brewfile$/i],
  },
];

/**
 * Detect tools from a list of file paths in a dotfiles repository.
 * Pure function — zero external calls, zero AI tokens.
 * Returns deduplicated list sorted by category.
 */
export function detectTools(filePaths: string[]): DetectedTool[] {
  const seen = new Set<string>();
  const tools: DetectedTool[] = [];

  for (const filePath of filePaths) {
    for (const rule of RULES) {
      if (seen.has(rule.name)) continue;
      for (const pattern of rule.patterns) {
        if (pattern.test(filePath)) {
          seen.add(rule.name);
          tools.push({
            name: rule.name,
            category: rule.category,
            icon: rule.icon,
            configFile: filePath,
          });
          break;
        }
      }
    }
  }

  return tools;
}

/**
 * Fetch file list from a GitHub repo URL using the GitHub API (no auth required for public repos).
 * Returns array of relative file paths.
 */
export async function fetchGitHubFileList(
  repoUrl: string
): Promise<{ files: string[]; error?: string }> {
  // Parse github.com/owner/repo from various URL formats
  const match = repoUrl.match(
    /github\.com[/:]([^/]+)\/([^/\s#?]+?)(?:\.git)?(?:\/|$)/
  );
  if (!match) {
    return { files: [], error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" };
  }

  const [, owner, repoName] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/HEAD?recursive=1`;

  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github+json" },
      // Optional: `Authorization: Bearer ${process.env.GITHUB_TOKEN}` for higher rate limits
    });

    if (!res.ok) {
      if (res.status === 404) return { files: [], error: "Repository not found. Make sure it's public." };
      if (res.status === 403) return { files: [], error: "GitHub API rate limit hit. Try again later or add GITHUB_TOKEN." };
      return { files: [], error: `GitHub API error: ${res.status}` };
    }

    const data = await res.json();
    if (!data.tree) return { files: [], error: "Could not fetch repository tree." };

    const files: string[] = [];
    for (const item of data.tree) {
      if (item.type === "blob") {
        files.push(item.path);
      }
    }

    return { files };
  } catch (err) {
    return { files: [], error: "Network error fetching repository data." };
  }
}

/**
 * Convenience: fetch GitHub file list + detect tools in one call.
 */
export async function analyzeRepo(
  repoUrl: string
): Promise<{
  detected: DetectedTool[];
  fileCount: number;
  error?: string;
}> {
  const { files, error } = await fetchGitHubFileList(repoUrl);
  if (error) return { detected: [], fileCount: 0, error };

  const detected = detectTools(files);
  return { detected, fileCount: files.length };
}
