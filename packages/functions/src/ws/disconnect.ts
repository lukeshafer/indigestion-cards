import { removeConnection } from "@core/lib/ws";
import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";

export const main: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  let connectionId = event.requestContext.connectionId;
  if (!connectionId) {
    return { statusCode: 400, body: "Invalid request." };
  }

  let { success, error } = await removeConnection({ connectionId });

  if (success) {
    return { statusCode: 200, body: "Disconnected" };
  } else {
    console.error("An error occurred during the connection creation process.", { error });
    return { statusCode: 500, body: "An unknown error occurred." };
  }
};
