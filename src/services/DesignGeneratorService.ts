import {
  ComponentConfig,
  DesignGenerationRequest,
  DesignSystem,
  DesignTemplate,
  SectionConfig,
} from "../types/design.type";

export const DesignGeneratorService = {
  async generateDesign(
    request: DesignGenerationRequest,
    designSystem: DesignSystem,
  ) {
    const template = designSystem.templates[request.template];

    // Load fonts
    await this.loadFonts(designSystem);

    // Create main page and frame
    const page = figma.createPage();
    page.name = template.name;

    const mainFrame = this.createMainFrame(template, request);

    // Generate sections
    for (const sectionConfig of template.sections) {
      const section = await this.generateSection(sectionConfig, request);
      mainFrame.appendChild(section);
    }

    page.appendChild(mainFrame);
    return mainFrame;
  },

  // Convert other methods to object methods
  async loadFonts(designSystem: DesignSystem) {
    // Define all font styles we need
    const fontStyles = [
      { family: "Inter", style: "Regular" },
      { family: "Inter", style: "Semi Bold" },
      { family: "Inter", style: "Bold" },
    ];

    // Load all fonts
    for (const font of fontStyles) {
      await figma.loadFontAsync(font);
    }

    // Also load fonts from design system
    for (const style of Object.values(designSystem.typography)) {
      await figma.loadFontAsync({
        family: style.fontFamily,
        style: style.fontStyle,
      });
    }
  },

  // ... rest of the methods, but change them to use request parameter instead of this.request
  createMainFrame(template: DesignTemplate, request: DesignGenerationRequest) {
    const frame = figma.createFrame();
    frame.name = template.name;
    frame.resize(template.width, template.height);
    frame.layoutMode = "VERTICAL";
    frame.counterAxisAlignItems = "CENTER";
    frame.itemSpacing = 0;
    frame.paddingLeft = 80;
    frame.paddingRight = 80;
    frame.fills = [
      { type: "SOLID", color: this.getColor("background", request) },
    ];
    return frame;
  },

  // Update other methods similarly...
  getColor(colorName: string, request: DesignGenerationRequest) {
    // Default colors as fallback
    const defaultColors = {
      background: "#FFFFFF",
      text: "#000000",
      primary: "#2563EB",
      secondary: "#3B82F6",
      white: "#FFFFFF",
    };

    const color =
      request.style.theme[colorName as keyof typeof request.style.theme] ||
      defaultColors[colorName as keyof typeof defaultColors] ||
      "#000000";
    return this.hexToRgb(color);
  },

  hexToRgb(hex: string) {
    // Safety check
    if (!hex || typeof hex !== "string") {
      return { r: 0, g: 0, b: 0 }; // Default to black
    }

    // Remove # if present
    hex = hex.replace("#", "");

    // Handle shorthand hex
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return { r: 0, g: 0, b: 0 }; // Default to black
    }

    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return { r, g, b };
  },

  async generateSection(
    config: SectionConfig,
    request: DesignGenerationRequest,
  ): Promise<FrameNode> {
    const section = figma.createFrame();
    section.name = config.name || "Section";
    section.layoutMode = "VERTICAL";
    section.counterAxisSizingMode = "FIXED";
    section.primaryAxisSizingMode = "AUTO";
    section.resize(400, 100);

    // Apply layout
    this.applyLayout(section, config.layout);

    // Apply style
    if (config.style) {
      this.applyStyle(section, config.style, request);
    }

    // Generate children with proper spacing
    for (const childConfig of config.children) {
      if (this.isComponentConfig(childConfig)) {
        const child = await this.generateComponent(childConfig, request);
        if (child) {
          section.appendChild(child);
          // Ensure proper sizing for text nodes
          if (child.type === "TEXT") {
            child.textAutoResize = "WIDTH_AND_HEIGHT";
          }
        }
      } else {
        const childSection = await this.generateSection(childConfig, request);
        section.appendChild(childSection);
      }
    }

    return section;
  },

  applyLayout(node: FrameNode, layout: SectionConfig["layout"]) {
    node.layoutMode = layout.mode;
    if (layout.padding) {
      node.paddingTop = layout.padding.top || 0;
      node.paddingBottom = layout.padding.bottom || 0;
      node.paddingLeft = layout.padding.left || 0;
      node.paddingRight = layout.padding.right || 0;
    }
    if (layout.spacing) {
      node.itemSpacing = layout.spacing;
    }
    if (layout.alignment) {
      if (layout.alignment.primary) {
        node.primaryAxisAlignItems = layout.alignment.primary as
          | "MIN"
          | "MAX"
          | "CENTER"
          | "SPACE_BETWEEN";
      }
      if (layout.alignment.counter) {
        node.counterAxisAlignItems = layout.alignment.counter as
          | "MIN"
          | "MAX"
          | "CENTER"
          | "BASELINE";
      }
    }
  },

  isComponentConfig(
    config: ComponentConfig | SectionConfig,
  ): config is ComponentConfig {
    return !("children" in config);
  },

  applyStyle(
    node: FrameNode,
    style: NonNullable<SectionConfig["style"]>,
    request: DesignGenerationRequest,
  ) {
    // Set default dimensions
    let width = node.width; // Keep existing width
    let height = node.height; // Keep existing height

    if (style.width || style.height) {
      const parentFrame = node.parent as FrameNode;

      if (style.width === "FILL_CONTAINER" && parentFrame) {
        width = parentFrame.width;
      } else if (typeof style.width === "number") {
        width = style.width;
      }

      if (style.height === "FILL_CONTAINER" && parentFrame) {
        height = parentFrame.height;
      } else if (typeof style.height === "number") {
        height = style.height;
      }

      // Only resize if we have valid dimensions
      if (width > 0 && height > 0) {
        node.resize(width, height);
      }
    }

    if (style.background) {
      node.fills = [
        { type: "SOLID", color: this.getColor(style.background, request) },
      ];
    }

    if (style.cornerRadius) {
      node.cornerRadius = style.cornerRadius;
    }

    if (style.effects) {
      node.effects = style.effects;
    }
  },

  async generateComponent(
    config: ComponentConfig,
    request: DesignGenerationRequest,
  ): Promise<SceneNode | null> {
    switch (config.type) {
      case "text":
        return this.createTextNode(config, request);
      case "button":
        return this.createButton(config, request);
      case "navLinks":
        return this.createNavLinks(config, request);
      default:
        console.warn(`Unknown component type: ${config.type}`);
        return null;
    }
  },

  async createTextNode(
    config: ComponentConfig,
    request: DesignGenerationRequest,
  ): Promise<TextNode> {
    // Load font if style specified
    if (config.props && config.props.fontStyle) {
      await figma.loadFontAsync({
        family: "Inter",
        style: config.props.fontStyle,
      });
    } else {
      // Load default font
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    }

    const text = figma.createText();
    if (config.props) {
      text.characters = config.props.text || "";
      if (config.props.fontSize) {
        text.fontSize = config.props.fontSize;
      }
      if (config.props.fontStyle) {
        text.fontName = { family: "Inter", style: config.props.fontStyle };
      }
      if (config.props.color) {
        text.fills = [
          { type: "SOLID", color: this.getColor(config.props.color, request) },
        ];
      }
    }
    return text;
  },

  async createButton(
    config: ComponentConfig,
    request: DesignGenerationRequest,
  ): Promise<FrameNode> {
    const button = figma.createFrame();
    button.layoutMode = "HORIZONTAL";
    button.primaryAxisAlignItems = "CENTER";
    button.counterAxisAlignItems = "CENTER";
    button.resize(200, 48);

    if (config.style && config.style.padding) {
      button.paddingTop = config.style.padding.top || 0;
      button.paddingBottom = config.style.padding.bottom || 0;
      button.paddingLeft = config.style.padding.left || 0;
      button.paddingRight = config.style.padding.right || 0;
    }

    if (config.props && config.props.color) {
      button.fills = [
        { type: "SOLID", color: this.getColor(config.props.color, request) },
      ];
    }

    const text = await this.createTextNode(config, request);
    button.appendChild(text);

    button.layoutMode = "HORIZONTAL";
    button.primaryAxisSizingMode = "AUTO";
    button.counterAxisSizingMode = "AUTO";

    return button;
  },

  createNavLinks(
    config: ComponentConfig,
    request: DesignGenerationRequest,
  ): FrameNode {
    const container = figma.createFrame();
    container.layoutMode = "HORIZONTAL";
    container.itemSpacing = 32;
    container.fills = [];
    container.primaryAxisSizingMode = "AUTO";
    container.counterAxisSizingMode = "AUTO";
    container.resize(400, 40);

    if (request.navLinks) {
      request.navLinks.forEach(async (link) => {
        const text = figma.createText();
        text.characters = link;
        text.textAutoResize = "WIDTH_AND_HEIGHT";
        if (config.props && config.props.fontSize) {
          text.fontSize = config.props.fontSize;
        }
        if (config.props && config.props.color) {
          text.fills = [
            {
              type: "SOLID",
              color: this.getColor(config.props.color, request),
            },
          ];
        }
        container.appendChild(text);
      });
    }

    return container;
  },
};
