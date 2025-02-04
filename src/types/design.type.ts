export interface DesignSystem {
  templates: {
    [key: string]: DesignTemplate;
  };
  components: {
    [key: string]: ComponentConfig;
  };
  typography: {
    [key: string]: TypographyStyle;
  };
  spacing: {
    [key: string]: number;
  };
}

export interface DesignTemplate {
  name: string;
  width: number;
  height: number;
  sections: SectionConfig[];
}

export interface SectionConfig {
  type: string;
  name: string;
  layout: {
    mode: "HORIZONTAL" | "VERTICAL";
    padding?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
    spacing?: number;
    alignment?: {
      primary?: "SPACE_BETWEEN" | "CENTER" | "START" | "END";
      counter?: "CENTER" | "START" | "END";
    };
  };
  style?: {
    width?: number | "FILL_CONTAINER";
    height?: number | "FILL_CONTAINER";
    background?: "background" | "primary" | "secondary" | "white";
    cornerRadius?: number;
    effects?: EffectConfig[];
  };
  children: (ComponentConfig | SectionConfig)[];
}

export interface ComponentConfig {
  type: string;
  props?: {
    text?: string;
    fontSize?: number;
    fontStyle?: "Regular" | "Semi Bold" | "Bold";
    color?: "text" | "primary" | "white";
    width?: number;
    height?: number;
  };
  style?: {
    padding?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
  };
}

export interface TypographyStyle {
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
}

export interface EffectConfig {
  type: "DROP_SHADOW";
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  offset: {
    x: number;
    y: number;
  };
  radius: number;
  spread: number;
  visible: boolean;
  blendMode: "NORMAL";
}

export interface DesignGenerationRequest {
  template: string;
  style: {
    theme: {
      [key: string]: string;
    };
  };
  navLinks?: string[];
}

export const designSystem = {
  templates: {
    landingPage: {
      name: "Landing Page",
      width: 1440,
      height: 900,
      sections: [
        {
          type: "navbar",
          name: "Header",
          layout: {
            mode: "HORIZONTAL",
            padding: { left: 80, right: 80 },
            alignment: {
              primary: "SPACE_BETWEEN",
              counter: "CENTER",
            },
          },
          style: {
            width: "FILL_CONTAINER",
            height: 80,
            background: "background",
          },
          children: [
            {
              type: "text",
              props: {
                text: "{{logo}}",
                fontSize: 24,
                fontStyle: "Bold",
                color: "text",
              },
            },
            {
              type: "section",
              layout: {
                mode: "HORIZONTAL",
                spacing: 32,
                alignment: {
                  primary: "CENTER",
                  counter: "CENTER",
                },
              },
              children: [
                {
                  type: "navLinks",
                  props: {
                    fontSize: 16,
                    color: "text",
                  },
                },
              ],
            },
          ],
        },
        {
          type: "hero",
          name: "Hero Section",
          layout: {
            mode: "VERTICAL",
            padding: { top: 80, bottom: 80 },
            spacing: 24,
            alignment: {
              primary: "CENTER",
              counter: "CENTER",
            },
          },
          style: {
            width: "FILL_CONTAINER",
            height: 500,
            background: "background",
          },
          children: [
            {
              type: "text",
              props: {
                text: "{{heroTitle}}",
                fontSize: 56,
                fontStyle: "Bold",
                color: "text",
              },
            },
            {
              type: "text",
              props: {
                text: "{{heroSubtitle}}",
                fontSize: 20,
                color: "text",
              },
            },
            {
              type: "button",
              props: {
                text: "{{ctaText}}",
                fontSize: 16,
                fontStyle: "Semi Bold",
                color: "white",
              },
              style: {
                padding: {
                  top: 16,
                  bottom: 16,
                  left: 32,
                  right: 32,
                },
              },
            },
          ],
        },
        {
          type: "features",
          name: "Features Section",
          layout: {
            mode: "VERTICAL",
            padding: { top: 80, bottom: 80 },
            spacing: 48,
            alignment: {
              primary: "CENTER",
              counter: "CENTER",
            },
          },
          style: {
            width: "FILL_CONTAINER",
            height: 400,
            background: "background",
          },
          children: [
            {
              type: "text",
              props: {
                text: "{{featuresTitle}}",
                fontSize: 40,
                fontStyle: "Bold",
                color: "text",
              },
            },
            {
              type: "featureCards",
              name: "Feature Cards",
              layout: {
                mode: "HORIZONTAL",
                spacing: 32,
                padding: { left: 80, right: 80 },
                alignment: {
                  primary: "CENTER",
                  counter: "CENTER",
                },
              },
              style: {
                width: 320,
                height: 320,
                background: "white",
                cornerRadius: 8,
                effects: [
                  {
                    type: "DROP_SHADOW",
                    color: { r: 0, g: 0, b: 0, a: 0.1 },
                    offset: { x: 0, y: 4 },
                    radius: 12,
                    spread: 0,
                    visible: true,
                    blendMode: "NORMAL",
                  },
                ],
              },
              children: [
                {
                  type: "text",
                  props: {
                    text: "{{cardTitle}}",
                    fontSize: 20,
                    fontStyle: "Semi Bold",
                    color: "text",
                  },
                },
                {
                  type: "text",
                  props: {
                    text: "{{cardDescription}}",
                    fontSize: 16,
                    color: "text",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  components: {},
  typography: {
    h1: {
      fontSize: 56,
      fontFamily: "Inter",
      fontStyle: "Bold",
    },
    h2: {
      fontSize: 40,
      fontFamily: "Inter",
      fontStyle: "Bold",
    },
    h3: {
      fontSize: 24,
      fontFamily: "Inter",
      fontStyle: "Bold",
    },
    body: {
      fontSize: 16,
      fontFamily: "Inter",
      fontStyle: "Regular",
    },
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 80,
  },
};

export const sampleLandingPageRequest: DesignGenerationRequest = {
  template: "landingPage",
  style: {
    theme: {
      primary: "#2563EB",
      secondary: "#3B82F6",
      background: "#FFFFFF",
      text: "#1F2937",
      accent: "#F59E0B",
    },
  },
  navLinks: ["Features", "Pricing", "About", "Contact"],
};
