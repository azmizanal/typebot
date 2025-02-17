import {
  VStack,
  Heading,
  Stack,
  Button,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { ToolIcon, TemplateIcon, DownloadIcon } from 'assets/icons'
import { useUser } from 'contexts/UserContext'
import { Typebot } from 'models'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { createTypebot, importTypebot } from 'services/typebots'
import { ImportTypebotFromFileButton } from './ImportTypebotFromFileButton'
import { TemplatesModal } from './TemplatesModal'

export const CreateNewTypebotButtons = () => {
  const { user } = useUser()
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [isLoading, setIsLoading] = useState(false)

  const toast = useToast({
    position: 'top-right',
    status: 'error',
    title: 'An error occured',
  })

  const handleCreateSubmit = async (typebot?: Typebot) => {
    if (!user) return
    setIsLoading(true)
    const folderId = router.query.folderId?.toString() ?? null
    const { error, data } = typebot
      ? await importTypebot(
          {
            ...typebot,
            ownerId: user.id,
            folderId,
            theme: {
              ...typebot.theme,
              chat: {
                ...typebot.theme.chat,
                hostAvatar: { isEnabled: true, url: user.image ?? undefined },
              },
            },
          },
          user.plan
        )
      : await createTypebot({
          folderId,
        })
    if (error) toast({ description: error.message })
    if (data)
      router.push({
        pathname: `/typebots/${data.id}/edit`,
        query:
          router.query.isFirstBot === 'true'
            ? {
                isFirstBot: 'true',
              }
            : {},
      })
    setIsLoading(false)
  }

  return (
    <VStack maxW="600px" w="full" flex="1" pt="20" spacing={10}>
      <Heading>Create a new typebot</Heading>
      <Stack w="full" spacing={6}>
        <Button
          variant="outline"
          w="full"
          py="8"
          fontSize="lg"
          leftIcon={<ToolIcon color="blue.500" boxSize="25px" mr="2" />}
          onClick={() => handleCreateSubmit()}
          isLoading={isLoading}
        >
          Start from scratch
        </Button>
        <Button
          variant="outline"
          w="full"
          py="8"
          fontSize="lg"
          leftIcon={<TemplateIcon color="orange.500" boxSize="25px" mr="2" />}
          onClick={onOpen}
          isLoading={isLoading}
        >
          Start from a template
        </Button>
        <ImportTypebotFromFileButton
          variant="outline"
          w="full"
          py="8"
          fontSize="lg"
          leftIcon={<DownloadIcon color="purple.500" boxSize="25px" mr="2" />}
          isLoading={isLoading}
          onNewTypebot={handleCreateSubmit}
        >
          Import a file
        </ImportTypebotFromFileButton>
      </Stack>
      <TemplatesModal
        isOpen={isOpen}
        onClose={onClose}
        onTypebotChoose={handleCreateSubmit}
      />
    </VStack>
  )
}
