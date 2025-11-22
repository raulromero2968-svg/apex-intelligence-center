_**File**: knowledge-08-mobile-performance.md_
_**Title**: React Native Performance Optimization Patterns_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [Mobile, FullStackDev]_
_**Tags**: [react-native, performance, optimization, mobile]_
---

## Overview

This guide provides a set of production-ready patterns for optimizing the performance of React Native applications. It covers common bottlenecks such as list rendering, re-renders, and the JavaScript bridge, providing actionable code examples to ensure a smooth, 60 FPS user experience.

## Core Implementation: Performance Patterns

### 1. Optimize FlatList and SectionList Rendering

Lists are a common source of performance issues. Use these props to optimize them.

-   **✅ Good Practice**: Use `FlatList` with optimization props.

    ```tsx
    import { FlatList } from 'react-native';

    const MyOptimizedList = ({ data }) => {
      const renderItem = ({ item }) => (
        // Your list item component
      );

      return (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          // Optimization Props
          initialNumToRender={10} // Render 10 items on initial load
          maxToRenderPerBatch={5} // Render 5 items per batch during scroll
          windowSize={11} // Render items in a window of 11 (5 above, 1 center, 5 below)
          removeClippedSubviews={true} // Unmount components that are off-screen
          getItemLayout={(data, index) => (
            // If your items have a fixed height, this avoids calculation on the fly
            { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
          )}
        />
      );
    };
    ```

-   **❌ Bad Practice**: Using `map` inside a `ScrollView`. This renders all items at once, causing performance issues with long lists.

### 2. Prevent Unnecessary Re-renders

Use `React.memo` for functional components and `PureComponent` for class components to prevent re-renders when props have not changed.

-   **✅ Good Practice**: Wrap components that don't need to re-render often in `React.memo`.

    ```tsx
    import React from 'react';
    import { View, Text } from 'react-native';

    const MyMemoizedComponent = React.memo(({ title }) => {
      // This component will only re-render if the `title` prop changes.
      return (
        <View>
          <Text>{title}</Text>
        </View>
      );
    });
    ```

-   **Use `useCallback` for functions passed as props**. This prevents child components from re-rendering because the function reference changes on every parent render.

    ```tsx
    import React, { useCallback } from 'react';

    const ParentComponent = () => {
      const handlePress = useCallback(() => {
        // Do something
      }, []);

      return <MyMemoizedComponent onPress={handlePress} />;
    };
    ```

### 3. Offload Heavy Computations from the JS Thread

The JavaScript thread is single-threaded. Long-running computations will block the UI. Offload them to a separate thread.

-   **✅ Good Practice**: Use a library like `react-native-threads` or the built-in `InteractionManager`.

    ```tsx
    import { InteractionManager } from 'react-native';

    function doHeavyWork() {
      InteractionManager.runAfterInteractions(() => {
        // Heavy computation here. This will run after animations are complete.
        const result = someComplexCalculation();
        // Update state with the result
      });
    }
    ```

-   For native-level performance, consider writing a native module in Swift/Kotlin and using a library like `react-native-worklets-core` to run JavaScript functions on a separate, high-priority thread.

### 4. Reduce Bridge Traffic

Every time data is passed between the JavaScript thread and the native thread, it goes over the React Native bridge. Excessive bridge traffic can cause performance issues.

-   **✅ Good Practice**: When dealing with animations, use the `useNativeDriver: true` flag. This sends the animation logic to the native side once and lets the native UI thread handle the animation, freeing up the JS thread.

    ```tsx
    import { Animated } from 'react-native';

    Animated.timing(myValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true, // The magic!
    }).start();
    ```

-   **❌ Bad Practice**: Updating a component's state rapidly in response to a gesture (e.g., `onScroll`). This sends a flood of events over the bridge. Use `Animated.event` with `useNativeDriver: true` instead.

## Trade-offs & Considerations

-   **`removeClippedSubviews`**: While it can improve memory usage, it can also have bugs where content briefly disappears. Test it thoroughly.
-   **`React.memo` is not free**: There is a small overhead to diffing the props. Don't wrap every single component in `memo`; only use it for components that are re-rendering unnecessarily.
-   **Native Modules**: Writing native modules adds complexity to your project and requires knowledge of Swift/Kotlin.

## Key Takeaways

1.  **Optimize your lists**. This is the most common source of performance problems in React Native.
2.  **Prevent unnecessary re-renders**. Use `React.memo` and `useCallback` judiciously.
3.  **Keep the JS thread free**. Offload heavy computations using `InteractionManager` or other threading solutions.
4.  **Use the native driver for animations**. `useNativeDriver: true` is essential for smooth animations.
5.  **Profile your app**. Use Flipper or the built-in React Native profiler to find your specific bottlenecks. Don't optimize prematurely.

## References

-   [React Native Performance Documentation](https://reactnative.dev/docs/performance)
-   [Optimizing FlatList Configuration](https://reactnative.dev/docs/optimizing-flatlist-configuration)
-   [Flipper (Debugging and Profiling Tool)](https://fbflipper.com/)
'''
'''
---
_**File**: knowledge-10-ux-accessible-components.md_
_**Title**: Building an Accessible Component Library with Radix UI Primitives_
_**Version**: 1.0_
_**Date**: 2025-11-17_
_**Author**: Grok, Master Code Architect_
_**Target_Disciples**: [UX, Visual, FullStackDev]_
_**Tags**: [accessibility, a11y, design-system, components, radix-ui, react]_
---

## Overview

This guide provides a production-ready blueprint for building a custom, accessible component library in a React/Next.js application. Instead of building components from scratch, we will leverage Radix UI, a library of unstyled, accessible primitives. This approach separates accessibility logic from visual styling, allowing for maximum design flexibility while ensuring WCAG compliance. This is the modern, professional way to build a design system.

## Core Implementation: Accessible Component Design with Radix

### 1. Philosophy: Separate Logic from Style

The core principle is to let Radix handle the complex accessibility logic (keyboard navigation, focus management, ARIA attributes) and then apply your own branding and styles on top. This is far more robust and maintainable than building everything from scratch.

### 2. Example: Building an Accessible `Dialog` (Modal) Component

A modal dialog is one of the hardest components to get right. Radix makes it simple.

```tsx
// components/ui/Dialog.tsx
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { styled, keyframes } from '@stitches/react'; // or your preferred styling solution

const overlayShow = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

const contentShow = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.96)' },
  '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

const StyledOverlay = styled(DialogPrimitive.Overlay, {
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  position: 'fixed',
  inset: 0,
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${overlayShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
  },
});

const StyledContent = styled(DialogPrimitive.Content, {
  backgroundColor: '#1A1A1A',
  borderRadius: 6,
  boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: '500px',
  maxHeight: '85vh',
  padding: 25,
  color: 'white',
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
  },
  '&:focus': { outline: 'none' },
});

function Content({ children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <StyledOverlay />
      <StyledContent {...props}>{children}</StyledContent>
    </DialogPrimitive.Portal>
  );
}

const StyledTitle = styled(DialogPrimitive.Title, {
  margin: 0,
  fontWeight: 500,
  color: '#FFFFFF',
  fontSize: 17,
});

const StyledDescription = styled(DialogPrimitive.Description, {
  margin: '10px 0 20px',
  color: '#E0E0E0',
  fontSize: 15,
  lineHeight: 1.5,
});

// Exports
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = Content;
export const DialogTitle = StyledTitle;
export const DialogDescription = StyledDescription;
export const DialogClose = DialogPrimitive.Close;
```

**Usage:**

```tsx
// app/some-page.tsx
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/Dialog';

const MyPageComponent = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button className="Button violet">Open Dialog</button>
    </DialogTrigger>
    <DialogContent>
      <DialogTitle>Accessible Modal</DialogTitle>
      <DialogDescription>
        This modal has full focus trapping, screen reader support, and keyboard navigation out of the box.
      </DialogDescription>
      <DialogClose asChild>
        <button className="Button green">Close</button>
      </DialogClose>
    </DialogContent>
  </Dialog>
);
```

### 3. Accessibility Features Handled by Radix

By using Radix, you get these critical a11y features for free:
-   **Focus Management**: Focus is automatically trapped within the modal and returned to the trigger button on close.
-   **Keyboard Navigation**: The modal can be closed with the `Escape` key.
-   **ARIA Attributes**: Radix automatically adds `role="dialog"`, `aria-modal="true"`, and manages `aria-labelledby` and `aria-describedby`.
-   **Screen Reader Support**: It correctly announces the dialog's title and description.

## Trade-offs & Considerations

-   **Bundle Size**: Adding a library like Radix increases your bundle size. However, it's tree-shakeable, so you only pay for the components you use. The cost is almost always worth the accessibility gains.
-   **Styling**: Radix is unstyled, which means you have to provide all the styling yourself. This is a feature, not a bug, as it gives you complete design control.
-   **Learning Curve**: There is a small learning curve to understanding the composition model of Radix (e.g., `Root`, `Trigger`, `Portal`, `Content`).

## Key Takeaways

1.  **Don't reinvent the wheel for accessibility**. Use headless UI libraries like Radix UI or React Aria.
2.  **Separate concerns**: Keep accessibility logic (from Radix) separate from your visual styling. This makes your design system more flexible and maintainable.
3.  **Test with real assistive technologies**. Automated tests with `jest-axe` are a good start, but you must also manually test with screen readers (VoiceOver, NVDA) and keyboard-only navigation.
4.  **Accessibility is a core UX principle, not an afterthought**. Building it in from the start saves massive amounts of time and effort later.
5.  **A beautiful design that isn't accessible is a failed design**. The best UX is inclusive.

## References

-   [Radix UI Primitives](https://www.radix-ui.com/primitives)
-   [WAI-ARIA Authoring Practices - Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
-   [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
-   [Stitches (CSS-in-JS library used in example)](https://stitches.dev/)
'''
