import { type TextProps, Text as RNText, type TextStyle } from "react-native";

import { colors, typography } from "@/shared/constants/tokens";

type Variant =
  "display" | "title" | "body" | "caption" | "muted" | "label" | "num";

interface TextPropsExt extends TextProps {
  variant?: Variant;
  bold?: boolean;
  color?: string;
}

const styles: Record<Variant, TextStyle> = {
  display: {
    fontFamily: typography.fontDisplay,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  title: {
    fontFamily: typography.fontDisplay,
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 26,
  },
  body: { fontFamily: typography.fontSans, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: typography.fontSans, fontSize: 12, lineHeight: 18 },
  muted: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  label: {
    fontFamily: typography.fontSans,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  num: {
    fontFamily: typography.fontMono,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
};

export function Text({
  variant = "body",
  bold,
  color,
  style,
  ...rest
}: TextPropsExt): React.JSX.Element {
  return (
    <RNText
      {...rest}
      style={[
        styles[variant],
        bold !== undefined && { fontWeight: bold ? "700" : "400" },
        color !== undefined && { color },
        style,
      ]}
    />
  );
}
