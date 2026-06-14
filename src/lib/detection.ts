// DotHub — Tool auto-detection engine
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

// Simple in-memory cache for GitHub API results (TTL: 5 minutes)
const cache = new Map<string, { data: { files: string[]; error?: string }; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: { files: string[]; error?: string }) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}
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
  {
    name: "Ghostty",
    category: "terminal",
    icon: "Terminal",
    patterns: [/ghostty\/config$/i, /\.config\/ghostty\/config$/i, /ghostty\.yml$/i],
  },
  {
    name: "Foot",
    category: "terminal",
    icon: "Terminal",
    patterns: [/foot\/foot\.ini$/i, /\.config\/foot\/foot\.ini$/i],
  },
  {
    name: "Warp",
    category: "terminal",
    icon: "Terminal",
    patterns: [/warp\/launch_configurations\.yaml$/i, /\.warp\//i],
  },
  {
    name: "Tabby",
    category: "terminal",
    icon: "Terminal",
    patterns: [/tabby\/config\.yaml$/i],
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
    name: "Xonsh",
    category: "shell",
    icon: "Terminal",
    patterns: [/\.xonshrc$/i, /xonsh\/rc\.xsh$/i],
  },
  {
    name: "Elvish",
    category: "shell",
    icon: "Terminal",
    patterns: [/\.elvish\/rc\.elv$/i, /elvish\/rc\.elv$/i],
  },
  {
    name: "Nushell",
    category: "shell",
    icon: "Terminal",
    patterns: [/env\.nu$/i, /config\.nu$/i, /\.nu$/i],
  },


  // === Editors ===
  {
    name: "Vimiv",
    category: "editor",
    icon: "FileCode",
    patterns: [/vimiv\/vimiv\.conf$/i],
  },
  {
    name: "Kakoune",
    category: "editor",
    icon: "FileCode",
    patterns: [/kak\/kakrc$/i, /\.config\/kak\/kakrc$/i],
  },
  {
    name: "Doom Emacs",
    category: "editor",
    icon: "FileCode",
    patterns: [/doom\/config\.el$/i, /doom\/init\.el$/i, /\.doom\.d\/config\.el$/i],
  },
  {
    name: "AstroNvim",
    category: "editor",
    icon: "FileCode",
    patterns: [/astronvim\/init\.lua$/i, /\.config\/astronvim\//i],
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
  {
    name: "dwm",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/dwm\/config\.h$/i, /\.config\/dwm\/config\.h$/i, /dwm\/config\.def\.h$/i],
  },
  {
    name: "herbstluftwm",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/herbstluftwm\/autostart$/i, /\.config\/herbstluftwm\//i],
  },
  {
    name: "openbox",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/openbox\/rc\.xml$/i, /\.config\/openbox\/rc\.xml$/i],
  },
  {
    name: "leftwm",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/leftwm\/config\.toml$/i, /\.config\/leftwm\/config\.toml$/i],
  },
  {
    name: "river",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/river\/init$/i, /\.config\/river\/init$/i],
  },
  {
    name: "fvwm",
    category: "window_manager",
    icon: "LayoutGrid",
    patterns: [/\.fvwm\/config$/i, /\.fvwm\/\.fvwm2rc$/i],
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
    patterns: [/Brewfile$/i, /.Brewfile$/i],
  },
  // === Launchers ===
  {
    name: "skhd",
    category: "launcher",
    icon: "Keyboard",
    patterns: [/skhd\/skhdrc$/i, /.config\/skhd\/skhdrc$/i],
  },
  // === Misc ===
  {
    name: "Karabiner",
    category: "misc",
    icon: "Keyboard",
    patterns: [/karabiner\/karabiner\.json$/i, /.config\/karabiner\/karabiner\.json$/i],
  },
  {
    name: "espanso",
    category: "misc",
    icon: "FileText",
    patterns: [/espanso\/default\.yml$/i, /.config\/espanso\//i],
  },
  {
    name: "Gnu Stow",
    category: "misc",
    icon: "Package",
    patterns: [/\.stow-local-ignore$/i, /stow\/.*$/i],
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
  const cacheKey = `tree:${owner}/${repoName}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/HEAD?recursive=1`;

  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetchWithTimeout(apiUrl, {
      timeout: 10000,
      headers,
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

    const result = { files };
    setCache(cacheKey, result);
    return result;
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
