import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'AUREA API - Development Version',
    version: '0.1.0',
    description: `
# AUREA Capstone Project API Documentation (v0 - Development)

⚠️ **This is the development version of the API, restricted to localhost access only.**

## About
AUREA is a capstone project that provides AI-powered PDF extraction and project management capabilities. This API allows users to:
- Extract project details from PDF documents using Google Gemini AI
- Manage projects and deliverables
- Handle user authentication with OTP verification

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Access Restrictions
- **v0 endpoints**: Localhost/development only (127.0.0.1, ::1)
- **Production**: Use v1 endpoints instead

## Response Format
All responses follow this structure:
\`\`\`json
{
  "success": true|false,
  "message": "Description of the result",
  "data": { ... } // or error object
}
\`\`\`

## Rate Limiting
- Development: No rate limits
- Production (v1): Rate limits apply

## Support
For issues or questions, please contact the development team.
    `,
    contact: {
      name: 'AUREA Development Team',
      email: 'support@aurea.dev'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v0',
      description: 'Development Server (Localhost Only)'
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check and system status endpoints'
    },
    {
      name: 'Authentication',
      description: 'User registration, login, and OTP verification'
    },
    {
      name: 'User Management',
      description: 'User profile and account management'
    },
    {
      name: 'AI Extraction',
      description: 'AI-powered PDF extraction using Google Gemini'
    },
    {
      name: 'Project Management',
      description: 'CRUD operations for projects and deliverables'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from login/OTP verification'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Error description'
              },
              code: {
                type: 'string',
                example: 'ERROR_CODE'
              }
            }
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation successful'
          },
          data: {
            type: 'object',
            description: 'Response data'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          user_id: {
            type: 'integer',
            example: 1
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          role: {
            type: 'string',
            enum: ['client', 'designer', 'admin'],
            example: 'designer'
          },
          email_verified: {
            type: 'boolean',
            example: true
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-28T10:00:00.000Z'
          },
          last_login_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-01-28T10:30:00.000Z'
          }
        }
      },
      Project: {
        type: 'object',
        properties: {
          project_id: {
            type: 'integer',
            example: 1
          },
          user_id: {
            type: 'integer',
            example: 1
          },
          project_name: {
            type: 'string',
            example: 'Website Redesign'
          },
          title: {
            type: 'string',
            example: 'Complete Website Overhaul'
          },
          description: {
            type: 'string',
            example: 'Full website redesign and modernization'
          },
          duration: {
            type: 'integer',
            description: 'Duration in days',
            example: 30
          },
          difficulty: {
            type: 'string',
            enum: ['Easy', 'Medium', 'Hard', 'Complex'],
            example: 'Medium'
          },
          licensing: {
            type: 'string',
            example: 'Exclusive'
          },
          usage_rights: {
            type: 'string',
            example: 'Commercial'
          },
          result: {
            type: 'string',
            example: 'Production-ready website'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Deliverable: {
        type: 'object',
        properties: {
          deliverable_id: {
            type: 'integer',
            example: 1
          },
          project_id: {
            type: 'integer',
            example: 1
          },
          deliverable_type: {
            type: 'string',
            example: 'Logo Design'
          },
          quantity: {
            type: 'integer',
            minimum: 1,
            example: 3
          }
        },
        required: ['deliverable_type', 'quantity']
      },
      ProjectWithDeliverables: {
        allOf: [
          { $ref: '#/components/schemas/Project' },
          {
            type: 'object',
            properties: {
              deliverables: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Deliverable'
                }
              }
            }
          }
        ]
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              error: {
                message: 'No token provided',
                code: 'UNAUTHORIZED'
              }
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Access forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              error: {
                message: 'Access denied. You do not own this resource.',
                code: 'FORBIDDEN'
              }
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              error: {
                message: 'Resource not found',
                code: 'NOT_FOUND'
              }
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error - invalid input',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: [
                  'Email is required',
                  'Password must be at least 6 characters'
                ]
              }
            }
          }
        }
      }
    },
    parameters: {
      userIdParam: {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'User ID',
        schema: {
          type: 'integer',
          minimum: 1
        }
      },
      projectIdParam: {
        name: 'projectId',
        in: 'path',
        required: true,
        description: 'Project ID',
        schema: {
          type: 'integer',
          minimum: 1
        }
      }
    }
  }
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: [
    './src/interfaces/routes/*.ts',
    './src/interfaces/controllers/*.ts',
    './src/swagger/paths/*.yaml' // For separate path definitions
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
