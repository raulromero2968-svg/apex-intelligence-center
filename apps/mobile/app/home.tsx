/// <reference types="nativewind/types" />
import { View, Text, ScrollView } from 'react-native';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';

export default function Home() {
  useEffect(() => {
    const transaction = Sentry.startTransaction({ name: 'home-screen-load' });

    // Simulate loading data
    setTimeout(() => {
      transaction.finish();
    }, 100);
  }, []);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        <Text className="text-3xl font-bold text-foreground mb-4">
          Welcome to Apex Intelligence
        </Text>

        <View className="bg-card p-4 rounded-lg mb-4 border border-border">
          <Text className="text-xl font-semibold text-card-foreground mb-2">
            Portfolio
          </Text>
          <Text className="text-muted-foreground">
            Your TCG portfolio overview will appear here
          </Text>
        </View>

        <View className="bg-card p-4 rounded-lg mb-4 border border-border">
          <Text className="text-xl font-semibold text-card-foreground mb-2">
            Watchlist
          </Text>
          <Text className="text-muted-foreground">
            Track your favorite cards and market trends
          </Text>
        </View>

        <View className="bg-card p-4 rounded-lg mb-4 border border-border">
          <Text className="text-xl font-semibold text-card-foreground mb-2">
            Market Insights
          </Text>
          <Text className="text-muted-foreground">
            Real-time market intelligence and analysis
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
